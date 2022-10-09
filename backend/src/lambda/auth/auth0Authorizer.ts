import { CustomAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda'
import 'source-map-support/register'

import { verify} from 'jsonwebtoken'
import { createLogger } from '../../utils/logger'
// import Axios from 'axios'
// import { Jwt } from '../../auth/Jwt'
import { JwtPayload } from '../../auth/JwtPayload'

const logger = createLogger('auth')

// TODO: Provide a URL that can be used to download a certificate that can be used
// to verify JWT token signature.
// To get this URL you need to go to an Auth0 page -> Show Advanced Settings -> Endpoints -> JSON Web Key Set
// const jwksUrl = 'https://dev--smdmfal.us.auth0.com/.well-known/jwks.json';

const cert = `-----BEGIN CERTIFICATE-----
MIIDDTCCAfWgAwIBAgIJY+X7tDj85CSBMA0GCSqGSIb3DQEBCwUAMCQxIjAgBgNV
BAMTGWRldi1zdWNuMzZhci51cy5hdXRoMC5jb20wHhcNMjIwOTI0MTgwOTI0WhcN
MzYwNjAyMTgwOTI0WjAkMSIwIAYDVQQDExlkZXYtc3VjbjM2YXIudXMuYXV0aDAu
Y29tMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAvrnDmUapZKWp13Pu
AMKiNWV3dpw7r1X+vLQQlbVZAGsfrojZ/XBRKk5MY/DzaPzof0cxG7ON1rLH99VQ
F8TqzyXw9HwPZYJA/BYPrjIG7SQb/0d4eAXdsoCS4gdDEZA4jHoOGOvWm3ii7BLb
5zbcxuO/n9tiDqo/4Sny5SwTCeSuzh1SFQL2RM6pcqMIOKWcIYvlVDtOZzvUXS6c
j4PJ2Vir16McDtwmjAxl+c3FyTCQYLjXbkdVqoYhhiHj4j4+s0w13E+DJUcTOfii
V1uk00GkFcnSDiU9rDaBT+hhoPzaiDQj1eQSCE1H3qFKehKSP6CSXM3g6h1A+DAx
2vQVZwIDAQABo0IwQDAPBgNVHRMBAf8EBTADAQH/MB0GA1UdDgQWBBTgOWvQv7Uc
T1+z3zJRolfKDsMQzzAOBgNVHQ8BAf8EBAMCAoQwDQYJKoZIhvcNAQELBQADggEB
ACiWPQ6uxvLMWdS/t5ii9iLO5TX7occzfqAKlVN6O+t2rH/gE/tBO6X5b0xcSyAL
+fafTtX2Kp6GMEKnuy7KjkRVE7dSO2kjZOFmlpeLwgBlG8iochy82Xk6vjfWx7B0
qyekFPx23kOPE0i9WNTMUUxxcSLOH8uOG3dnt1XOH3nNess09661/JkvB2y2X/Si
SYC3E29fBM4kcM7dsIBjuFcwFatsr0ajzIXcR1uqhvRRho6V+PS5VFz4wsaXggnV
15oenVAUVOHb4QSZZQf6nJkWEQzmtAYh/uFrEa7waEZM1hEui+Jw4/2jtX4FQQqf
qSue4NUOJVKLkJ08j5mTJt0=
-----END CERTIFICATE-----`;

export const handler = async (
  event: CustomAuthorizerEvent
): Promise<CustomAuthorizerResult> => {
  logger.info('Authorizing a user', event.authorizationToken)
  try {
    const jwtToken = await verifyToken(event.authorizationToken)
    logger.info('User was authorized', jwtToken)

    return {
      principalId: jwtToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*'
          }
        ]
      }
    }
  } catch (e) {
    logger.error('User not authorized', { error: e.message })

    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*'
          }
        ]
      }
    }
  }
}

async function verifyToken(authHeader: string): Promise<JwtPayload> {
  const token = getToken(authHeader)
//  const jwt: Jwt = decode(token, { complete: true }) as Jwt

  // TODO: Implement token verification
  // You should implement it similarly to how it was implemented for the exercise for the lesson 5
  // You can read more about how to do this here: https://auth0.com/blog/navigating-rs256-and-jwks/
  return verify(token, cert, { algorithms: ['RS256'] }) as JwtPayload
}

function getToken(authHeader: string): string {
  if (!authHeader) throw new Error('No authentication header')

  if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authentication header')

  const split = authHeader.split(' ')
  const token = split[1]

  return token
}