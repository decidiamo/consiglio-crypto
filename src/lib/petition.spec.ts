import test from 'ava';
import * as faker from 'faker';

import {
  acceptPetition,
  createIssuerKeypair,
  createKeypair,
  createPetitionRequest,
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
