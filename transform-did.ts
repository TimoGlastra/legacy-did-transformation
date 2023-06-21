import { Key, KeyType } from "@aries-framework/core";

type DidDocument = {};

type LegacyPublicKey = {
  id: string;
  controller: string;
  type: "Ed25519VerificationKey2018";
  publicKeyBase58: string;
};

type LegacyReferencedPublicKey = {
  publicKey: string;
  type: "Ed25519SignatureAuthentication2018";
};

type LegacyService = {
  id: string;
  type: string;
  serviceEndpoint: string;

  recipientKeys: string[];
  routingKeys?: string[];
  priority?: number;
};

interface LegacyDidDocument {
  "@context": string[];
  publicKey?: LegacyPublicKey[];
  authentication?: Array<LegacyPublicKey | LegacyReferencedPublicKey>;
  service?: LegacyService[];
  id: string;
}

export function convertToNewDidDocument(
  legacyDidDocument: LegacyDidDocument
): string {
  let did = "did:peer:2";
  const authenticationFingerprints: string[] = [];

  // Loop through the authentication
  for (const legacyAuthentication of legacyDidDocument.authentication ?? []) {
    if (
      legacyAuthentication.type !== "Ed25519SignatureAuthentication2018" &&
      legacyAuthentication.type !== "Ed25519VerificationKey2018"
    ) {
      continue;
    }

    let resolvedLegacyAuthentication: LegacyPublicKey;
    if (legacyAuthentication.type === "Ed25519SignatureAuthentication2018") {
      const _resolvedLegacyAuthentication = legacyDidDocument.publicKey?.find(
        (pk) => pk.id === legacyAuthentication.publicKey
      );

      if (!_resolvedLegacyAuthentication) {
        throw new Error(
          `Could not find referenced key ${legacyAuthentication.publicKey}`
        );
      }

      resolvedLegacyAuthentication = _resolvedLegacyAuthentication;
    } else {
      resolvedLegacyAuthentication = legacyAuthentication as LegacyPublicKey;
    }

    const fingerprint = Key.fromPublicKeyBase58(
      resolvedLegacyAuthentication.publicKeyBase58,
      KeyType.Ed25519
    ).fingerprint;

    authenticationFingerprints.push(fingerprint);
  }

  // Loop through the public keys
  for (const publicKey of legacyDidDocument.publicKey ?? []) {
    // We only support Ed25519VerificationKey2018
    if (publicKey.type !== "Ed25519VerificationKey2018") {
      continue;
    }

    const fingerprint = Key.fromPublicKeyBase58(
      publicKey.publicKeyBase58,
      KeyType.Ed25519
    ).fingerprint;

    // Skip if already in authentication
    if (authenticationFingerprints.includes(fingerprint)) {
      continue;
    }

    authenticationFingerprints.push(fingerprint);
  }

  for (const fingerprint of authenticationFingerprints) {
    did += `.V${fingerprint}`;
  }

  // TODO: didcomm v1 service (that is used by ACA-Py currently for DIDExchange)
  // TODO: should we transform IndyAgent into didcomm v1 service?
  for (const service of legacyDidDocument.service ?? []) {
    // We skip all types that are not IndyAgent
    if (service.type !== "IndyAgent") {
      continue;
    }

    // NOTE: we sort the properties alphabetically to make sure the order is
    // consistent for encoding to did:peer:2 dids.
    const json = {
      priority: service.priority,
      r: service.routingKeys,
      recipientKeys: service.recipientKeys,
      s: service.serviceEndpoint,
      t: "IndyAgent",
    };

    const encoded = Buffer.from(JSON.stringify(json)).toString("base64url");

    did += `.S${encoded}`;
  }

  // TODO: should we transform all the ed25519 authentication keys to X25519 and add them to the keyAgreement array?

  return did;
}
