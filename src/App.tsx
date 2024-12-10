import {
  Alert,
  Authenticator,
  Button,
  Card,
  Collection,
  TextField,
} from "@aws-amplify/ui-react";
import { StorageBrowser } from "@aws-amplify/ui-react-storage";
import { generateClient } from "aws-amplify/api";
import {
  associateWebAuthnCredential,
  signIn,
  SignInInput,
} from "aws-amplify/auth";
import { nanoid } from "nanoid";
import { useState } from "react";
import { Schema } from "../amplify/data/resource";

const services = {
  async handleSignIn(input: SignInInput) {
    // パスワードが入力されていなければパスキーでサインインさせる
    return await signIn(
      input.password
        ? input
        : {
            username: input.username,
            options: {
              authFlowType: "USER_AUTH",
              preferredChallenge: "WEB_AUTHN",
            },
          }
    );
  },
};
const formFields = {
  signIn: {
    password: {
      isRequired: false,
    },
  },
};

function App() {
  const client = generateClient<Schema>({ authMode: "userPool" });

  const [generationResult, setGenerationResult] = useState("");
  const generation = async () => {
    const { data } = await client.generations.generateRecipe({
      description: "A gluten free chocolate cake",
    });
    setGenerationResult(JSON.stringify(data));
  };

  const getConversation = async () => {
    return (await client.conversations.chat.create()).data;
  };

  const [message, setMessage] = useState("");
  const [aiMessage, setAiMessage] = useState("");
  const [nowStreaming, setNowStreaming] = useState(false);
  const [history, setHistory] = useState<
    { role: "user" | "assistant"; message: string; id: string }[]
  >([]);
  let conversation: Awaited<ReturnType<typeof getConversation>>;
  const postMessage = async () => {
    let localHistory = history;
    conversation ??= await getConversation();
    // Assistant messages come back as websocket events
    // over a subscription
    let recievedChunk = "";
    setAiMessage("");
    setNowStreaming(true);
    conversation?.onStreamEvent({
      next: (event) => {
        if (event.text) {
          recievedChunk += event.text;
          setAiMessage(recievedChunk);
        }
        if (
          event.stopReason &&
          localHistory[localHistory.length - 1].role === "user"
        ) {
          localHistory.push({
            role: "assistant",
            message: recievedChunk,
            id: nanoid(),
          });
          recievedChunk = "";
          setHistory(localHistory);
          setAiMessage(recievedChunk);
          setNowStreaming(false);
        }
      },
      error: (error) => {
        console.log(error);
      },
    });
    // When sending user messages you only need to send
    // the latest message, the conversation history
    // is stored in DynamoDB and retrieved in Lambda
    localHistory.push({ role: "user", message, id: nanoid() });
    setHistory(localHistory);
    conversation?.sendMessage({
      content: localHistory.map((v) => ({ text: v.message })),
    });
  };
  return (
    <main>
      <Authenticator services={services} formFields={formFields}>
        {({ signOut, user }) => (
          <main>
            <Card>
              <h1>Hello {user?.username}</h1>
              <Button onClick={signOut}>Sign out</Button>
              <Button
                variation="primary"
                onClick={() => associateWebAuthnCredential()}
              >
                パスキーを登録
              </Button>
              <StorageBrowser></StorageBrowser>

              <Button variation="primary" onClick={() => generation()}>
                Generation
              </Button>
              <Alert>{generationResult}</Alert>

              <TextField
                label="message"
                onInput={(e) => setMessage(e.currentTarget.value)}
              ></TextField>
              <Button variation="primary" onClick={() => postMessage()}>
                Conversation
              </Button>
              <Collection
                items={
                  nowStreaming
                    ? [
                        ...history,
                        {
                          role: "assistant",
                          message: aiMessage,
                          id: "latest",
                        },
                      ]
                    : history
                }
                type="list"
                direction="column"
                gap="20px"
                wrap="nowrap"
              >
                {(item) => (
                  <Card key={item.id}>
                    {item.role}: {item.message}
                  </Card>
                )}
              </Collection>
            </Card>
          </main>
        )}
      </Authenticator>
    </main>
  );
}

export default App;
