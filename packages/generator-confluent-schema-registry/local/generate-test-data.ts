import axios from 'axios';

const SCHEMA_REGISTRY_URL = 'http://localhost:8081';

type SchemaType = 'AVRO' | 'JSON' | 'PROTOBUF';

const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const registerSchema = async (subject: string, schemaType: SchemaType, schema: string) => {
  try {
    const payload = {
      schemaType,
      schema,
    };

    const res = await axios.post(`${SCHEMA_REGISTRY_URL}/subjects/${subject}/versions`, payload, {
      headers: {
        'Content-Type': 'application/vnd.schemaregistry.v1+json',
      },
    });

    console.log(`✅ ${subject} v${res.data.version}`);
  } catch (err: any) {
    console.error(`❌ ${subject}:`, err.response?.data || err.message);
  }
};

const generateJsonSchema = (subject: string, version: number) => {
  const schema: any = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    title: `${subject}_v${version}`,
    type: 'object',
    properties: {
      id: { type: 'string' },
    },
    required: ['id'],
  };

  if (version >= 2) schema.properties.timestamp = { type: 'string' };
  if (version >= 3) schema.properties.status = { type: 'string' };
  if (version === 4) schema.properties.active = { type: 'boolean' };

  return JSON.stringify(schema);
};

const generateAvroSchema = (subject: string, version: number) => {
  const fields: any[] = [{ name: 'id', type: 'string' }];
  if (version >= 2) fields.push({ name: 'name', type: 'string' });
  if (version >= 3) fields.push({ name: 'timestamp', type: 'string' });
  if (version === 4) fields.push({ name: 'active', type: 'boolean', default: true });

  return JSON.stringify({
    type: 'record',
    name: `${subject.replace(/-/g, '_')}_v${version}`,
    fields,
  });
};

const generateProtobufSchema = (subject: string, version: number) => {
  const baseName = subject.replace(/-/g, '_'); // remove hyphens
  let fields = `string id = 1;\n`;
  if (version >= 2) fields += `string name = 2;\n`;
  if (version >= 3) fields += `int64 timestamp = 3;\n`;
  if (version === 4) fields += `bool active = 4;\n`;

  return `
    syntax = "proto3";
    package com.example;

    message ${baseName} {
      ${fields}
    }
  `.trim();
};
const subjects: { subject: string; type: SchemaType }[] = [
  { subject: 'user-registered-value', type: 'JSON' },
  { subject: 'order-created-value', type: 'JSON' },
  { subject: 'payment-received-value', type: 'JSON' },

  { subject: 'shipment-created-value', type: 'AVRO' },
  { subject: 'inventory-updated-value', type: 'AVRO' },
  { subject: 'customer-deleted-value', type: 'AVRO' },

  { subject: 'analytics-event-click-value', type: 'PROTOBUF' },
  { subject: 'analytics-event-view-value', type: 'PROTOBUF' },
  { subject: 'analytics-event-convert-value', type: 'PROTOBUF' },
];

const run = async () => {
  for (const { subject, type } of subjects) {
    const versionCount = getRandomInt(1, 4);
    for (let version = 1; version <= versionCount; version++) {
      const schema =
        type === 'JSON'
          ? generateJsonSchema(subject, version)
          : type === 'AVRO'
            ? generateAvroSchema(subject, version)
            : generateProtobufSchema(subject, version);

      await registerSchema(subject, type, schema);
    }
  }

  console.log('🎉 Done registering all schemas!');
};

run();
