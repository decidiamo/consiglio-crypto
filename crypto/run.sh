#!/usr/bin/env bash

# RNGSEED="hex:00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"

####################
# common script init
. utils.sh
Z="`detect_zenroom_path` `detect_zenroom_conf`"

function json_extract {
	if ! [ -r extract.jq ]; then
		cat <<EOF > extract.jq
# break out early
def filter(\$key):
  label \$out
  | foreach inputs as \$in ( null;
      if . == null
      then if \$in[0][0] == \$key then \$in
           else empty
           end
      elif \$in[0][0] != \$key then break \$out
      else \$in
      end;
      select(length==2) );

reduce filter(\$key) as \$in ({};
  setpath(\$in[0]; \$in[1]) )
EOF
	fi
	jq -n -c --arg key "$1" --stream -f extract.jq "$2"
}

function json_remove {
	tmp=`mktemp`
	jq -M "del(.$1)" $2 > $tmp
	mv $tmp $2
}

function json_join {
	jq -s . $@
}

# server generates its issuer key at installation
cat <<EOF | zexe issuer_keygen.zen > issuer_keypair.json
Scenario credential: publish verifier
Given that I am known as 'Decidiamo'
When I create the issuer keypair
Then print my 'issuer keypair'
EOF


cat <<EOF > new_account.json
{"username": "Alice"}
EOF

# user keypair is stored in the owner's client
cat <<EOF | zexe create_user.zen -a new_account.json | tee keypair.json
Scenario ecdh: create the keypair at user creation
Given that my name is in a 'string' named 'username'
When I create the keypair
Then print my 'keypair'
EOF

# owners's public key is stored in the server to verify petition request signatures
cat <<EOF | zexe user_pubkey.zen -a new_account.json -k keypair.json > pubkey.json
Scenario 'ecdh': Publish the public key
Given that my name is in a 'string' named 'username'
and I have my 'keypair'
Then print my 'public key' from 'keypair'
EOF

# list of emails to send signature credentials
cat <<EOF > participants.json
{ "participants": [ "jaromil@dyne.org", "puria@dyne.org", "andrea@dyne.org" ] }
EOF

# create a petition request to send to the petition server
cat <<EOF | zexe request_petition.zen -k keypair.json -a participants.json | tee petition_request.json | jq .
Scenario credential: create the petition credentials
Scenario petition: create the petition
Scenario ecdh: sign the petition

# state my identity
Given that I am known as 'Alice'
and I have my 'keypair'
and I have a 'string array' named 'participants'

# create the petition and its keypair
When I create the credential keypair
and I create the petition 'More privacy for all!'

# sign the hash
# When I create the hash of 'petition'
When I create the signature of 'petition'
and I insert 'signature' in 'petition'

When I create the signature of 'participants'
and I rename the 'signature' to 'participants.signature'

Then print my 'credential keypair'
and print the 'petition'
and print the 'participants'
and print the 'participants.signature'
and print the 'public key' inside 'keypair'
EOF

# Alice salva la petition keypair da qualche parte (forse anche il server)
json_extract "Alice" petition_request.json > petition_keypair.json

# Alice e/o il server rimuove il petition keypair dalla request
json_remove "Alice" petition_request.json

# server verifies signature and accepts the petition
cat <<EOF | zexe accept_petition.zen -a petition_request.json -k pubkey.json | tee new_petition.json | jq .
Scenario ecdh
Scenario petition

Given that I have a 'public key' from 'Alice'
and I have a 'petition'
and I have a 'string array' named 'participants'
and I have a 'signature' named 'participants.signature'

When I verify the 'petition' is signed by 'Alice'
and I verify the new petition to be empty

When I verify the 'participants' has a signature in 'participants.signature' by 'Alice'
and I verify 'participants' contains a list of emails

Then print 'petition'
and print 'participants'
and print the 'uid' as 'string' inside 'petition'

EOF

# cat <<EOF | zexe publish

# EOF
# json_remove participants petition.json
# ...then uses the list of participants to send an email with link to
# credential request creation

# server stores the petition without the list of participants and
# adding its verifier key, it may publish the petition on a blockchain
cat <<EOF | debug publish_petition.zen -a new_petition.json -k issuer_keypair.json | tee petition.json | jq .
Scenario credential
Scenario petition
Given I am 'Decidiamo'
and I have my 'issuer keypair'
and I have a 'petition'
# when I remove 'participants' from 'petition'
When I create the copy of 'verifier' from dictionary 'issuer keypair'
and I rename the 'copy' to 'verifier'
and I insert 'verifier' in 'petition'
Then print the 'petition'
EOF


# ------------
# mail is sent
# ------------
# *click!*


cat <<EOF > participant_email.json
{"email": "bob@wonder.land",
 "petition_uid": "More privacy for all!"}
EOF

# participant accepts the invite and visits the link
# server uses this to generate a unique payload
cat <<EOF | debug credential_issuance.zen -k issuer_keypair.json -a participant_email.json | tee signature_credential.json | jq .
Scenario credential
Given that I am known as 'Decidiamo'
and I have my 'issuer keypair'
and I have a 'string' named 'email'
and I have a 'string' named 'petition_uid'
When I append 'email' to 'petition_uid'
and I create the hash of 'petition_uid'
and I create the credential keypair with secret key 'hash'
and I create the credential request
and I create the credential signature
and I create the credentials
Then print the 'credentials'
and print the 'credential keypair'
and print the 'verifier'
EOF

# participant signs the petition and submits
cat <<EOF | zexe signature_proof.zen -a signature_credential.json | tee sign_proof.json | jq .
Scenario credential
Scenario petition: sign petition
Given I am 'Bob'
and I have a 'credential keypair'
and I have a 'credentials'
and I have a 'verifier'
When I aggregate the verifiers
and I create the petition signature 'More privacy for all!'
# TODO: take UID from a HEAP variable
Then print the 'petition signature'
EOF

# server adds the signature - moving the petition file around is
# necessary only for bash scripts if system can write modifications in
# place.
mv petition.json old-petition.json
cat <<EOF | zexe add_sign_proof.zen -a old-petition.json -k sign_proof.json | tee petition.json | jq .
Scenario credential
Scenario petition: aggregate signature
Given that I am 'Decidiamo'
and I have a 'petition signature'
and I have a 'petition'

When the petition signature is not a duplicate
and the petition signature is just one more
and I add the signature to the petition
Then print the 'petition'
EOF

