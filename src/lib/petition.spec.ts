import test from 'ava';
import * as faker from 'faker';

import {
  acceptPetition,
  aggregateSignature,
  createIssuerKeypair,
  createKeypair,
  createPetitionRequest,
  createSignatureCredential,
  createSignProof,
  generatePetition,
  getIssuer,
  publishKeypair,
  publishPetition,
} from './petition';

test('createIssuerKeypair', async (t) => {
  const name = faker.name.firstName();
  const result = await createIssuerKeypair(name);
  t.log(name);
  t.true(name in result);
});

test('createKeypair', async (t) => {
  const name = faker.name.firstName();
  const result = await createKeypair(name);
  t.truthy(result[name].keypair.public_key);
  t.truthy(result[name].keypair.private_key);
  t.true(name in result);
});

test('createPetitionRequest', async (t) => {
  const name = faker.name.firstName();
  const keypair = await createKeypair(name);
  const petitionName = faker.lorem.slug();
  const participants = Array.from({ length: 30 }, () => faker.internet.email());
  const result = await createPetitionRequest(
    keypair,
    participants,
    petitionName
  );
  t.log(result);
  t.truthy(result.petition.scores.neg);
  t.truthy(result.petition.scores.pos);
  t.truthy(result.participants);
  t.is(result.public_key, keypair[name].keypair.public_key);
});

test('publishPetition', async (t) => {
  const issuerName = faker.name.firstName();
  const name = faker.name.firstName();
  const issuerKeypair = await createIssuerKeypair(issuerName);
  const keypair = await createKeypair(name);
  const pk = await publishKeypair(keypair);
  const petitionName = faker.lorem.slug();
  const participants = Array.from({ length: 30 }, () => faker.internet.email());
  const petitionRequest = await createPetitionRequest(
    keypair,
    participants,
    petitionName
  );
  const acceptedPetition = await acceptPetition(petitionRequest, pk);
  const result = await publishPetition(acceptedPetition, issuerKeypair);
  t.log(result);
  t.truthy(result.petition);
  t.is(result.petition.scores.neg.left, 'f38=');
  t.is(result.petition.scores.neg.right, 'f38=');
  t.is(result.petition.scores.pos.left, 'f38=');
  t.is(result.petition.scores.pos.right, 'f38=');
});

test('generatePetition with issuer name', async (t) => {
  const issuerName = faker.name.firstName();
  const name = faker.name.firstName();
  const petitionName = faker.lorem.slug();
  const participants = Array.from({ length: 30 }, () => faker.internet.email());
  const result = await generatePetition(petitionName, name, participants, {
    issuerName,
  });
  t.log(result);
  t.truthy(result.petition);
  t.is(result.petition.scores.neg.left, 'f38=');
  t.is(result.petition.scores.neg.right, 'f38=');
  t.is(result.petition.scores.pos.left, 'f38=');
  t.is(result.petition.scores.pos.right, 'f38=');
});

test('generatePetition with issuerKeypair', async (t) => {
  const issuerName = faker.name.firstName();
  const issuerKeypair = await createIssuerKeypair(issuerName);
  const name = faker.name.firstName();
  const petitionName = faker.lorem.slug();
  const participants = Array.from({ length: 30 }, () => faker.internet.email());
  const result = await generatePetition(petitionName, name, participants, {
    issuerKeypair,
  });
  t.log(result);
  t.truthy(result.petition);
  t.is(result.petition.scores.neg.left, 'f38=');
  t.is(result.petition.scores.neg.right, 'f38=');
  t.is(result.petition.scores.pos.left, 'f38=');
  t.is(result.petition.scores.pos.right, 'f38=');
});

test('createSignatureCredential', async (t) => {
  const issuerName = faker.name.firstName();
  const issuerKeypair = await createIssuerKeypair(issuerName);
  const email = faker.internet.email();
  const petitionUid = faker.lorem.slug();
  const signatureCredential = await createSignatureCredential(
    issuerKeypair,
    email,
    petitionUid
  );

  t.log(signatureCredential);
  t.truthy(signatureCredential.credential_keypair);
  t.truthy(signatureCredential.credentials);
  t.truthy(signatureCredential.verifier);
});

test('createSignProof', async (t) => {
  const issuerName = faker.name.firstName();
  const issuerKeypair = await createIssuerKeypair(issuerName);
  const email = faker.internet.email();
  const petitionUid = faker.lorem.slug();
  const signatureCredential = await createSignatureCredential(
    issuerKeypair,
    email,
    petitionUid
  );
  const result = await createSignProof(signatureCredential, petitionUid, email);
  t.truthy(result.petition_signature.uid_petition);
  t.truthy(result.petition_signature.uid_signature);
  t.truthy(result.petition_signature.proof);
});

test('aggregateSignature', async (t) => {
  const issuerName = faker.name.firstName();
  const issuerKeypair = await createIssuerKeypair(issuerName);

  const ownerName = faker.name.firstName();
  const petitionName = faker.lorem.slug();
  const participants = Array.from({ length: 30 }, () => faker.internet.email());
  const petition = await generatePetition(
    petitionName,
    ownerName,
    participants,
    {
      issuerKeypair,
    }
  );
  const signatureCredential = await createSignatureCredential(
    issuerKeypair,
    participants[0],
    petitionName
  );
  const signProof = await createSignProof(
    signatureCredential,
    petitionName,
    participants[0]
  );

  const result = await aggregateSignature(petition, signProof, issuerName);
  t.truthy(result.petition);
  t.not(result.petition.scores.neg.left, 'f38=');
  t.not(result.petition.scores.neg.right, 'f38=');
  t.not(result.petition.scores.pos.left, 'f38=');
  t.not(result.petition.scores.pos.right, 'f38=');
});

test('generatePetition with default values', async (t) => {
  const name = faker.name.firstName();
  const petitionName = faker.lorem.slug();
  const participants = Array.from({ length: 30 }, () => faker.internet.email());
  const result = await generatePetition(petitionName, name, participants, {});
  t.log(result);
  t.truthy(result.petition);
  t.is(result.petition.scores.neg.left, 'f38=');
  t.is(result.petition.scores.neg.right, 'f38=');
  t.is(result.petition.scores.pos.left, 'f38=');
  t.is(result.petition.scores.pos.right, 'f38=');
});

test('getIssuer', async (t) => {
  const result = await getIssuer({});
  const result2 = await getIssuer({ name: 'ISSUER' });
  t.log(result);
  t.is(Object.keys(result)[0], 'Decidiamo');
  t.is(Object.keys(result2)[0], 'ISSUER');
});
