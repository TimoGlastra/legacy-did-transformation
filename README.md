# Legacy DID Transformation

This repository describes how to transform legacy dids and did documents to qualified did:peer:2 and did:peer:3 dids and did documents.

## Transformation

In this transformation, the legacy did document is called `legacyDidDocument`.

1. Create a new property called `did` and assign it the initial string value `did:peer:2`.
2. Create an empty **ordered list** called `authenticationFingerprints`.
3. Loop through the `authentication` list from the `legacyDidDocument` and for each of the entries perform the following steps:
   1. if the value of the `type` property in the entry is `Ed25519SignatureAuthentication2018` and the entry contains a `publicKey`
      1. resolve the `publicKey` property from the `publicKey` list in the `legacyDidDocument` to a value named `resolvedLegacyAuthentication`.
      2. If the referenced public key could not be found in the `publicKey`, an error must be thrown and the process must be aborted, otherwise continue with step 2.4
   2. else if the value of the `type` property is `Ed25519Signature2018`, assign the value of the entry to `resolvedLegacyAuthentication` and continue with step 2.4
   3. else ignore the entry and continue with the next entry.
   4. Calculate the multibase, multicodec encoded public key from the value of `publicKeyBase58` property in `resolvedLegacyAuthentication` and assign this to the the property `fingerprint`.
   5. Add the `fingerprint` value to the `authenticationFingerprints` list.
4. Loop through the `publicKey` list from the `legacyDidDocument` and for each of the entries perform the following steps:
   1. if the value of the `type` property is not `Ed25519Signature2018` ignore the entry and continue with the next entry.
   2. Calculate the multibase, multicodec encoded public key from the value of `publicKeyBase58` property in the entry and assign this to the the property `fingerprint`.
   3. If the value of `fingerprint` already exists in the list `authenticationFingerprints` ignore the entry and continue with the next entry.
   4. Add the `fingerprint` value to the `authenticationFingerprints` list.
5. For each entry in the `authenticationFingerprints` list perform the following steps:
   1. Append `.V` and the `fingerprint` to the `did` property.
6. Loop through the `service` list from the `legacyDidDocument` and for each of the entries perform the following steps:
   1. if the value of the `type` property is not `IndyAgent` ignore the entry and continue with the next entry.
   2. Create a new object called `service` and assign it the following properties (in alphabetical order). If your language does not support ordered objects, you can use
      1. `priority` based on the `priority` property from the entry.
      2. `r` based no the `routingKeys` property from the entry.
      3. `recipientKeys` based on the `recipientKeys` property from the entry.
      4. `s` based on the `serviceEndpoint` property from the entry.
      5. `t` based on the `type` property from the entry.
   3. Follow `did:peer:2` service encoding algorithm from the spec and append the final value to the `did` property.

## Test Vectors

See the [test vectors](./test-vectors) directory for examples of the transformation.

## Transform

```sh
git clone https://github.com/TimoGlastra/legacy-did-transformation
cd legacy-did-transformation
yarn install
yarn convert <path-to-legacy-did-document>
```

## Questions

- Do we want to support DIDComm v1 entries (in addition to `IndyAgent`)?
- Do we want to transform IndyAgent services to DIDComm v1 services?
- Should we transform all the ed25519 authentication keys to X25519 and add them to the keyAgreement array?
