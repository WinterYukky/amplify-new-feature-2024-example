import { defineBackend } from "@aws-amplify/backend";
import { auth } from "./auth/resource";
import { data } from "./data/resource";

const backend = defineBackend({
  auth,
  data,
});
const { cfnResources } = backend.auth.resources;
const { cfnUserPool, cfnUserPoolClient } = cfnResources;

cfnUserPool.addPropertyOverride(
  "Policies.SignInPolicy.AllowedFirstAuthFactors",
  ["PASSWORD", "WEB_AUTHN"]
);

cfnUserPoolClient.explicitAuthFlows = [
  "ALLOW_REFRESH_TOKEN_AUTH",
  "ALLOW_USER_AUTH",
  "ALLOW_USER_SRP_AUTH",
];

cfnUserPool.webAuthnRelyingPartyId = "localhost";
cfnUserPool.webAuthnUserVerification = "required";
