# DWP External Identity User Interface

This NodeJS app provides a custom registration and authentication interface to DWP Dynamic Trust Hub (DTH)
Authentication Service. It is based on standard GDS frontend and requires access to a ForgeRock environment to function.

### Prerequisites 

- [Node.JS LTS version](https://github.com/nvm-sh/nvm#installing-and-updating)
- [Gulp](https://gulpjs.com/docs/en/getting-started/quick-start/)

### Running the application
 
    # configure
    cp .env.example .env

    # install
    npm i

    # build CSS/JS
    npm run build

    # run
    npm start

The app will then be available with a URL like this: [http://localhost:3000/register](http://localhost:3000/register)

## Email notifications - stub

The email notifications will be sent via [https://www.notifications.service.gov.uk/](Govuk Notify) in Production, however we mainly use a stub in development. The stub for identifying the security codes sent in emails is as follows:

https://reach.stubs.dev.shefcon-dev.dwpcloud.uk/email?email=[email-address-used-in-reg]

Note that the email needs to be url encoded, in particular the '@' needs to be replaced with %40. (e.g. scoby%40gmail.com).

## SMS Notification -Reach stub
The team will need to use the following URL in their web browser to get the mobile code from the remotely deployed stub (replace the Mobile-number with the one to check)” :


NOTE: Reach API used for sending security code by SMS is currently stubbed. To get these code on dev environment use following GET request:
https://reach.stubs.dev.shefcon-dev.dwpcloud.uk/sms?mobileNumber=[mobile-number-used-in-reg]


## Downstream service and rmd-stub

This ui is intended to provide signin functionality for a downstream service. So for development purposes, it is important to stub the downstream service, so that when the user signs in they are first redirected from the stubbed downstream service, and then returned to the downstream service when signin is successful.

This stubbed functionality is currently provided by the repo 'rmd-stub', which can be found here: https://gitlab.com/dwp/dynamic-trust-hub/stubs/rmd-stub. Please refer to rmd-stub README for setting up the rmd-stub.

When rmd-stub is cloned and running, then it will be available on [http://localhost:3002/benefit](http://localhost:3002/benefit). The stub will then be used in connection with the signin journey on this current application, so they both need to running at the same time (see 'Running the Application' above to start the current application running). E.g. when you navigate to  http://localhost:3002/benefit, there is a 'Start Now' button on the page. Clicking on Start Now will redirect the user to the page on http://localhost:3000/authenticate, which is the starting page for the signin jounrey. When the signin journey is complete, the user will be returned to the cxp stub.

Note the .env variable SIGNIN_LINK is used whenever this UI service needs to link to the signin journey (for example at the end of the Registration journey). This SIGNIN_LINK needs to link to a protected page in the downstream service, so that the user will be redirected to the signin page when they are not signed in. For the rmd-stub, the protected page used is http://localhost:3002/benefit/options. This is the value used in the .env.example page in this application.

However, note that we can only use the single .env variable SIGNIN_LINK when there is only one downstream service. When we come to serve more than one downstream service, we will need to address this as the sign in links will need to link to the protected page of different services.

## Using the HMRC Stubs

After the LUR journey the UI will redirect to HMRC so that identity verification can be performed via HMRC IV. Currently this functionality is available in the HMRC stubs. 

There are two HMRC stubs - one developed from within DTH and one in HMRC's test environment. Information around using these and adding in your own data can be found in [this document](https://gitlab.com/dwp/dynamic-trust-hub/knowledge-based-verification/hmrc-ebv/-/blob/develop/docs/hmrc-stubs.md).

### Running the accessibility test suite

`npm run test:axe`

### Running the test suite - this runs accessibility and unit test suite together

`npm test`

## Live example
NOTE: There is no dev/test environment yet, link below is going to your local deploy until one is available.
- [Registration](http://localhost:3000/register)

## Standard User Test Details:

When using the UI in development mode,  it is necessary to have test details of a user for certain screens. These include:
- The name, date of birth and postcode screens in the Sign in and Update Mobile journeys.
- The National Insurance Number in the HMRC Stub page (during first Sign in journey).

The following user test details can be used currently:

- First Name: Kyle
- Last Name: Scoby
- Date of Birth: 23-Nov-1967
  Postcode - any validly formatted postcode will do
- National Insurance Number: RJ428577D

Also on the HMRC Stub page you can select 'Success' and enter 'passport, p60' in the 'Successful evidences' field.
See above section 'Using the HMRC Stubs' for more information on the HMRC Stub.

## Nomenclature

- **IDM**: ForgeRock Identity Manager - this service is responsible for account creation, aka 'provisioning'
- **AM**: ForgeRock Access Manager - this service is responsible for logging users into ForgeRock as well as controlling
policies regarding what a user is permitted to access
- **Realm**: ForgeRock term for a subset of users within AM. The 'Citizens' realm is targeted within this app.
- **Authentication tree**: ForgeRock term for an authentication flow. The tree in use is 'DWP-Authentication'

## Technical documentation

This is a NodeJS application allows citizens to register and login using 
DWP (ForgeRock) account. Further details are available. 

### Dependencies

- [Forgeops](https://gitlab.nonprod.dwpcloud.uk/idt/infra/forgeops) - ForgeRock AM and IDM environments

## Redis session management
The service will use redis database for user session management. It is not required to have a redis instance running for local development. If the .env variables REDIS_HOST and REDIS_PORT are blank, then the service will run locally with in-memory session management.

However, if local development or testing requires a redis instance, one can be set up with docker as follows:
`docker run --name redis-instance -p 6379:6379 -d redis`

To stop:
`docker stop redis-instance`
To start again:
`docker start redis-instance`

Now add environment variables in .env file as follows:

REDIS_HOST=localhost

REDIS_PORT=6379 

## Licence

[ISC License (ISC)](LICENSE)
