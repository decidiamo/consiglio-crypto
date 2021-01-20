import { zencode_exec } from 'zenroom';

import {
  AcceptedPetition,
  IssuerKeypair,
  Keypair,
  PetitionRequest,
  PublicKeypair,
  PublishedPetition,
} from './interfaces';

const CONFIG = 'memmanager=lw';

/**
 * Creates an ISSUER keypair
 *
 * ### Example (es module)
 * ```js
 * import { createIssuerKeypair } from 'petition-crypto'
 * createIssuerKeypair().then(ikp => {
 *    console.log(ikp)
 * })
 * // =>
 * ```
 *
 * ### Example (commonjs)
 * ```js
 * var createIssuerKeypair = require('typescript-starter').createIssuerKeypair;
 * createIssuerKeypair().then(ikp => {
 *    console.log(ikp)
 * })
 * // => 8
 * ```
 *
 * @param value - Comment describing the `value` parameter.
 * @returns Comment describing the return type.
 * @anotherNote Some other value.
 */
export const createIssuerKeypair = async (
  name: string
): Promise<IssuerKeypair> => {
  const { result } = await zencode_exec(
    `Scenario credential: publish verifier
    Given that I am known as '${name}'
    When I create the issuer keypair
    Then print my 'issuer keypair'`,
    { conf: CONFIG }
  );
  return JSON.parse(result);
};

export const createKeypair = async (name: string): Promise<Keypair> => {
  const { result } = await zencode_exec(
    `
  Scenario ecdh: create the keypair at user creation
    Given that my name is in a 'string' named 'username'
    When I create the keypair
    Then print my 'keypair'
  `,
    {
      data: JSON.stringify({ username: name }),
      conf: CONFIG,
    }
  );
  return JSON.parse(result);
};

export const createPetitionRequest = async (
  keypair: Keypair,
  participants: readonly string[],
  petitionName: string
): Promise<PetitionRequest> => {
  const name = Object.keys(keypair)[0];
  const { result } = await zencode_exec(
    `
    Scenario credential: create the petition credentials
    Scenario petition: create the petition
    Scenario ecdh: sign the petition
    Given that I am known as '${name}'
    and I have my 'keypair'
    and I have a 'string array' named 'participants'
    When I verify 'participants' contains a list of emails
    When I create the credential keypair
    and I create the petition '${petitionName}'
    When I create the signature of 'petition'
    and I insert 'signature' in 'petition'
    When I create the signature of 'participants'
    and I rename the 'signature' to 'participants.signature'
    Then print the 'petition'
    and print the 'participants'
    and print the 'participants.signature'
    and print the 'public key' inside 'keypair'
  `,
    {
      data: JSON.stringify({ participants }),
      keys: JSON.stringify(keypair),
      conf: CONFIG,
    }
  );
  return JSON.parse(result);
};

export const publishKeypair = async (
  keypair: Keypair
): Promise<PublicKeypair> => {
  const name = Object.keys(keypair)[0];
  const { result } = await zencode_exec(
    `
    Scenario 'ecdh': Publish the public key
Given that my name is in a 'string' named 'username'
and I have my 'keypair'
Then print my 'public key' from 'keypair'
    `,
    {
      keys: JSON.stringify(keypair),
      data: JSON.stringify({ username: name }),
      conf: CONFIG,
    }
  );
  return JSON.parse(result);
};

export const acceptPetition = async (
  petitionRequest: PetitionRequest,
  keypair: PublicKeypair
): Promise<AcceptedPetition> => {
  const name = Object.keys(keypair)[0];
  const { result } = await zencode_exec(
    `
      Scenario ecdh
      Scenario petition
      Given that I have a 'public key' from '${name}'
      and I have a 'petition'
      and I have a 'string array' named 'participants'
      and I have a 'signature' named 'participants.signature'
      When I verify the 'petition' is signed by '${name}'
      and I verify the new petition to be empty
      When I verify the 'participants' has a signature in 'participants.signature' by '${name}'
      and I verify 'participants' contains a list of emails
      Then print 'petition'
      and print 'participants'
      and print the 'uid' as 'string' inside 'petition'
    `,
    {
      data: JSON.stringify(petitionRequest),
      keys: JSON.stringify(keypair),
      conf: CONFIG,
    }
  );
  return JSON.parse(result);
};

export const publishPetition = async (
  acceptedPetition: AcceptedPetition,
  issuerKeypair: IssuerKeypair
): Promise<PublishedPetition> => {
  const issuerName = Object.keys(issuerKeypair)[0];
  const { result } = await zencode_exec(
    `
    Scenario credential
    Scenario petition
    Given I am '${issuerName}'
    and I have my 'issuer keypair'
    and I have a 'petition'
    When I create the copy of 'verifier' from dictionary 'issuer keypair'
    and I rename the 'copy' to 'verifier'
    and I insert 'verifier' in 'petition'
    Then print the 'petition'
  `,
    {
      data: JSON.stringify(acceptedPetition),
      keys: JSON.stringify(issuerKeypair),
      conf: CONFIG,
    }
  );
  return JSON.parse(result);
};
