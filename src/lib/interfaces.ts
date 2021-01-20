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
  readonly list?: readonly string[];
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

export type SignatureCredential = {
  readonly credential_keypair: {
    readonly private: string;
    readonly public: string;
  };

  readonly credentials: {
    readonly h: string;
    readonly s: string;
  };

  readonly verifier: Verifier;
};

export type SignProof = {
  readonly petition_signature: {
    readonly proof: {
      readonly kappa: string;
      readonly nu: string;
      readonly pi_v: {
        readonly c: string;
        readonly rm: string;
        readonly rr: string;
      };
      readonly sigma_prime: {
        readonly h_prime: string;
        readonly s_prime: string;
      };
    };
    readonly uid_signature: string;
    readonly uid_petition: string;
  };
};
