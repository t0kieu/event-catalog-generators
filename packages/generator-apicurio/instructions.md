I want you to create a new generator for this project.

The generator is for integration with the Apicurio Registry.

We already added a client.ts file in this project with the API access you will hopefully need, if you need to add more please do so.
API Docs can be found here https://www.apicur.io/registry/docs/apicurio-registry/2.1.x/assets-attachments/registry-rest-api.htm#tag/Versions/operation/listArtifactVersions


The generator needs to follow the same pattenrns as the other generators in terms of code style and implementation.

Lets get the basic pattern working for now

  generators: [
    [
      '@eventcatalog/generator-apicurio',
      {
        // The URL of your Apicurio Registry
        registryUrl: 'http://localhost:8080',
        // The producers and consumers (services) to assign schemas to (optional)
        services: [
          {
            id: 'Orders Service',
            version: '1.0.0',
            // The name of the artifact to assign to the service
            sends: [{ events: ['order-placed', 'order-cancelled']}],
            // The Order services receives commands that match the schema name `place-order` or `cancel-order`
            receives: [{ commands: ['place-order', 'cancel-order']}],
          }
        ]
      }
    ]
  ],
};

In this example we have a single service called "Orders Service" that is assigned the artifacts "order-placed" and "order-cancelled" to the service.
The generator will go and fetch the schemas from the regitry and assign them to the services and also create teh messages we need too.

Look at the generator-confluent-schema-registry for a similar example on how to do this.

I also want you to create the tests for this plugin, very similar to the confluent-schema-registry tests, similar format, same patterns.

Lets start with some basic examples, and we can go from there. Just get this example working first.