import { Authenticator, Button } from "@aws-amplify/ui-react";
import {
  associateWebAuthnCredential,
  signIn,
  SignInInput,
} from "aws-amplify/auth";

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
  return (
    <main>
      <Authenticator services={services} formFields={formFields}>
        {({ signOut, user }) => (
          <main>
            <h1>Hello {user?.username}</h1>
            <Button onClick={signOut}>Sign out</Button>
            <Button
              variation="primary"
              onClick={() => associateWebAuthnCredential()}
            >
              パスキーを登録
            </Button>
          </main>
        )}
      </Authenticator>
    </main>
  );
}

export default App;
