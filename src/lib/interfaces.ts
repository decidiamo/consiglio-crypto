export type Verifier = {
  readonly alpha: string;
  readonly beta: string;
};

export type IssuerSign = {
  readonly x: string;
  readonly y: string;
};

export type InnerIssuerKeypair = {
  readonly verifier: Verifier;
  readonly issuer_sign: IssuerSign;
};

export type IssuerKeypairContainer = {
  readonly issuer_keypair: InnerIssuerKeypair;
};

export type IssuerKeypair = {
  readonly [x: string]: IssuerKeypairContainer;
};

export type Keypair = {
  readonly [key: string]: {
    readonly keypair: {
      readonly private_key: string;
      readonly public_key: string;
    };
  };
};

export type PublicKeypair = {
  readonly [name: string]: {
    readonly public_key: string;
  };
};

export type Petition = {
  readonly owner: string;
  readonly scores: {
    readonly neg: {
      readonly left: string;
      readonly right: string;
    };
    readonly pos: {
      readonly left: string;
      readonly right: string;
    };
  };
  readonly signature?: {
    readonly r: string;
    readonly s: string;
  };
  readonly uid: string;
  readonly verifier?: Verifier;
};

export type PetitionRequest = {
  readonly participants: ReadonlyArray<string>;
  readonly 'participants.signature': {
    readonly r: string;
    readonly s: string;
  };
  readonly petition: Petition;
  readonly public_key: string;
};

export type AcceptedPetition = {
  readonly participants: readonly string[];
  readonly petition: Petition;
  readonly uid: string;
};

export type PublishedPetition = {
  readonly petition: Petition;
};
