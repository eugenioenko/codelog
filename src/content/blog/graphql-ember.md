---
author: Yevhen Yakhnenko
pubDatetime: 2024-01-06
title: GraphQL in Your Ember App with Glimmer Apollo
slug: graphql-ember
featured: false
tags:
  - graphql
  - ember
  - apollo
description: GraphQL in Your Ember App with Glimmer Apollo
---

## Introduction:

Ember.js, a robust JavaScript framework for building ambitious web applications, has gained popularity for its convention over configuration approach and developer-friendly features. To enhance data fetching and management in Ember applications, integrating GraphQL is a powerful choice. In this article, we'll explore how to unleash the capabilities of GraphQL in your Ember app using [Glimmer Apollo](https://glimmer-apollo.com/).

## 1. Starting new Ember Project

We can create a new Ember project by using `ember-cli`. If you don't have it already installed, its as simple as

```bash
yarn global add ember-cli
or
npm install -g ember-cli
```

Once you have `ember-cli` installed, to create a new Ember project:

```bash
ember new my-project-name
cd my-project-name
```

## 2. Adding Typescript Support (optional)

This step is not strictly necessary but without it, you won't get the benefit of type checking on your queries.
Installing ember-cli-typescript allows to write ember component using typescript instead of javascript.

```bash
yarn add --dev ember-cli-typescript
```

## 3. Installing Glimmer Apollo and Dependencies

We will be using [Glimmer Apollo](https://glimmer-apollo.com/) to integrate the Apollo Client. To install the necessary dependencies:

```bash
yarn add -dev glimmer-apollo @apollo/client graphql
```

Thats it, all the Glimmer Apollo dependencies are installed

## 4. Configuring Apollo Client

To be able to use Apollo Client, we need to configure it and create an instance of the client first.
Create a script file in your project, in this example we are gonna be using `/app/config/apollo.ts`

```typescript
// Import the setClient function from the "glimmer-apollo" package.
import { setClient } from "glimmer-apollo";

// Import necessary Apollo Client modules.
import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
} from "@apollo/client/core";

// Define a function that sets up and configures the Apollo Client.
export default function setupApolloClient(context: object): void {
  // Create an HTTP link that points to the GraphQL server.
  const httpLink = createHttpLink({
    uri: "https://graphqlzero.almansi.me/api",
  });

  // Create an in-memory cache for Apollo Client to store data.
  const cache = new InMemoryCache();

  // Create an instance of Apollo Client with the configured link and cache.
  const apolloClient = new ApolloClient({
    link: httpLink,
    cache,
  });

  // Set the Apollo Client instance on the provided context object.
  setClient(context, apolloClient);
}
```

The previous code imports the necessary modules from the "apollo/client/core" package, including the ApolloClient class, InMemoryCache, and createHttpLink function. The setupApolloClient function is then defined, which creates an HTTP link pointing to a GraphQL server (in this case, "https://graphqlzero.almansi.me/api" which is a mock graphql api), an in-memory cache for storing Apollo Client data, and finally, an instance of the Apollo Client with the configured link and cache. The created Apollo Client instance is then set on the provided context object using the setClient function from the "glimmer-apollo" package.

Remember to update the `createHttpLink` `uri` parameter to the url of your Graphql api

Finally, to instantiate the previous initialization code, we can use Embers [Instance Initializer](https://guides.emberjs.com/release/applications/initializers/).

Application instance initializers are run as an application instance is loaded. They provide a way to configure the initial state of your application, as well as to set up dependency injections that are local to the application instance.

To create an Instance Initializer for our Apollo Client configuration you can execute:

```bash
ember generate instance-initializer apollo
```

Or simple create a file `/app/instance-initializer/apollo.ts`

```typescript
import setupApolloClient from "../config/apollo";

export default {
  initialize: setupApolloClient,
};
```

We set the `setupApolloClient` function exported from previous step so that it is run once the application instance is loaded.

And thats it, Glimmer Apollo is ready to be used!

## 4. Adding 1st Graphql Query

Lets create our first Graphql query and used in a component. We can do so by creating the following files.

```
app
└── components
    └── first-query
        ├── index.hbs
        ├── index.ts
        └── resources.ts
```

### 4.1 Defining Glimmer Apolllo Query in resources.ts

The api we are using for this tutorial has quit a few queries defined, you can explore the schema here: [https://graphqlzero.almansi.me/api](https://graphqlzero.almansi.me/api)

For this tutorial we are gonna be fetching the a user name by his id. We can achieve that with the following query

```typescript
export function useUserByIdQuery<T extends UseQuery<any, any>>(
  ctx: Object,
  args?: T["args"]
): T["return"] {
  return useQuery(ctx, () => [
    gql`
      query UserById($id: ID!) {
        user(id: $id) {
          id
          name
        }
      }
    `,
    args ? args() : {},
  ]);
}
```

There are three important parts to this code.

The query section `query UserById($id: ID!) {` where we define the query we want to execute.

The `UseQuery<any, any>` defines the type of the arguments the query receives and the type of data the query returns. For now its `<any, any>` but we will fix it in the step 5.

### 4.2 Using the Glimmer Apollo Query in our component class

```bash
import Component from "@glimmer/component";
import { useUserByIdQuery } from "./resources";

export default class FirstQuery extends Component {
  query = useUserByIdQuery(this, () => ({
    variables: {
      id: 1,
    },
  }));
}
```

The `useUserByIdQuery` takes in two arguments.
First is the context for the execution of the query. Usually this will be the instance of the component in which the query is used. Its required so that Glimmer Apollo can cleanup properly the resources after the component is destroyed.

Second argument is a list of arguments to pass to the Apollo Client to modify how the query is executed. More [info here](https://www.apollographql.com/docs/react/data/queries/)

We need to pass the Id of the user we want to fetch. We can do that by passing it as the `variables` property of the arguments

### 4.3 Fetching the data in the template

```hbs
{{#if this.query.loading}}
  loading...
{{else if this.query.error}}
  {{this.query.error}}
{{else if this.query.data}}
  {{this.query.data.user.name}}
{{/if}}
```

When we access the `loading` or `data` properties of the query, Glimmer Apollo will execute the query and fetch the data making it available in the `data` property. And if there was an `error` it will set the `error` property of the query.

Finally, to view this in action, use the `<FirstQuery />` component.

One thing to note is that the variables passed to the query are reactive. If the variable is a tracked variable, when its value changes the query will execute again.

```typescript
import Component from "@glimmer/component";
import { tracked } from "@glimmer/tracking";
import { useUserByIdQuery } from "./resources";

export default class FirstQuery extends Component {
  @tracked userId = 1;

  query = useUserByIdQuery(this, () => ({
    variables: {
      id: this.userId,
    },
  }));
}
```

If we change the value of `this.userId = 2` the query will execute again and fetch the data for user with Id 2.

## 5. Adding Graphql Code Generator (optional)

GraphQL Code Generator is a plugin-based tool that helps you get the best out of your GraphQL stack.

From back-end to front-end, GraphQL Code Generator automates the generation of:

Typed Queries, Mutations and, Subscriptions for React, Vue, Angular, Next.js, Svelte, Ember whether you are using Apollo Client, URQL or, React Query.
Typed GraphQL resolvers, for any Node.js (GraphQL Yoga, GraphQL Modules, TypeGraphQL or Apollo) or Java GraphQL server.

To add `graphql-codegen` to our project:

```bash
yarn add --dev @graphql-codegen/cli @graphql-codegen/typescript @graphql-codegen/typescript-operations @graphql-codegen/named-operations-object
```

After the dependency is installed we need to initiate the code generator. This can be done by executing:

Add the following config in the root of the project `codegen.yml`

```yml
overwrite: true
hooks:
  afterAllFileWrite:
    - prettier --write
schema: ["https://graphqlzero.almansi.me/api"]
documents: "app/**/*.{graphql,ts}"
generates:
  types/graphqlzero-api/index.d.ts::
    plugins:
      - typescript
      - typescript-operations
  app/utils/gql-operations.ts:
    plugins:
      - named-operations-object
    config:
      identifierName: namedOperations
  tests/mocks/schema.graphql:
    plugins:
      - schema-ast
```

The key properties of this config are

- `schema`: the url of the graphql-api schema
- `documents`: the list of files that should be scanned for graphql queries
- `plugins`: sets the plugins used for the code generation

Now you can generate the typescript types for your queries. And also a list of the queries and mutations by name which comes in handy for mock testing. To do that, execute `graphql-codegen` by passing the config file:

```bash
graphql-codegen --config codegen.yml
```

You can also make it more accessible by adding this line in the scripts of `pacakge.json`

```json
 "codegen": "graphql-codegen --config codegen.yml"
```

After the graphql types are generated, we can now update our query to include the proper types. Lets revisit how the `resources.ts` file looks like for our `FirstQuery` component:

```typescript
import { gql, useQuery } from "glimmer-apollo";
import type { UseQuery } from "glimmer-apollo";
import type { UserByIdQuery, UserByIdQueryVariables } from "graphqlzero-api";

export function useUserByIdQuery<
  T extends UseQuery<UserByIdQuery, UserByIdQueryVariables>,
>(ctx: Object, args?: T["args"]): T["return"] {
  return useQuery(ctx, () => [
    gql`
      query UserById($id: ID!) {
        user(id: $id) {
          id
          name
        }
      }
    `,
    args ? args() : {},
  ]);
}
```

The main difference is now we can use the proper type for our UseQuery `UseQuery<UserByIdQuery, UserByIdQueryVariables>`

## Conclusion

By integrating Glimmer Apollo into your Ember application, you can seamlessly incorporate GraphQL for efficient data fetching and management. This powerful combination enhances your development experience, providing flexibility and performance in handling complex data requirements.

Copy of this project is available in [this repository](https://github.com/eugenioenko/ember-glimmer-apollo-starter)

{% embed https://replit.com/@eugenioenko/ember-glimmer-apollo-starter %}
