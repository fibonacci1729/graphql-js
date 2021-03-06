/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  GraphQLSchema,
  GraphQLScalarType,
  GraphQLEnumType,
  GraphQLInputObjectType,
  GraphQLInterfaceType,
  GraphQLObjectType,
  GraphQLUnionType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLInt,
  GraphQLString,
  GraphQLBoolean,
} from '../';

import { describe, it } from 'mocha';
import { expect } from 'chai';

import { isObjectType, isInputType, isOutputType } from '../definition';

const BlogImage = new GraphQLObjectType({
  name: 'Image',
  fields: {
    url: { type: GraphQLString },
    width: { type: GraphQLInt },
    height: { type: GraphQLInt },
  },
});

const BlogAuthor = new GraphQLObjectType({
  name: 'Author',
  fields: () => ({
    id: { type: GraphQLString },
    name: { type: GraphQLString },
    pic: {
      args: { width: { type: GraphQLInt }, height: { type: GraphQLInt } },
      type: BlogImage,
    },
    recentArticle: { type: BlogArticle },
  }),
});

const BlogArticle = new GraphQLObjectType({
  name: 'Article',
  fields: {
    id: { type: GraphQLString },
    isPublished: { type: GraphQLBoolean },
    author: { type: BlogAuthor },
    title: { type: GraphQLString },
    body: { type: GraphQLString },
  },
});

const BlogQuery = new GraphQLObjectType({
  name: 'Query',
  fields: {
    article: {
      args: { id: { type: GraphQLString } },
      type: BlogArticle,
    },
    feed: {
      type: GraphQLList(BlogArticle),
    },
  },
});

const BlogMutation = new GraphQLObjectType({
  name: 'Mutation',
  fields: {
    writeArticle: {
      type: BlogArticle,
    },
  },
});

const BlogSubscription = new GraphQLObjectType({
  name: 'Subscription',
  fields: {
    articleSubscribe: {
      args: { id: { type: GraphQLString } },
      type: BlogArticle,
    },
  },
});

const ObjectType = new GraphQLObjectType({ name: 'Object' });
const InterfaceType = new GraphQLInterfaceType({ name: 'Interface' });
const UnionType = new GraphQLUnionType({ name: 'Union', types: [ObjectType] });
const EnumType = new GraphQLEnumType({ name: 'Enum', values: { foo: {} } });
const InputObjectType = new GraphQLInputObjectType({ name: 'InputObject' });
const ScalarType = new GraphQLScalarType({
  name: 'Scalar',
  serialize() {},
  parseValue() {},
  parseLiteral() {},
});

describe('Type System: Example', () => {
  it('defines a query only schema', () => {
    const BlogSchema = new GraphQLSchema({
      query: BlogQuery,
    });

    expect(BlogSchema.getQueryType()).to.equal(BlogQuery);

    const articleField = BlogQuery.getFields()[('article': string)];
    expect(articleField && articleField.type).to.equal(BlogArticle);
    expect(articleField && articleField.type.name).to.equal('Article');
    expect(articleField && articleField.name).to.equal('article');

    const articleFieldType = articleField ? articleField.type : null;

    const titleField =
      isObjectType(articleFieldType) &&
      articleFieldType.getFields()[('title': string)];
    expect(titleField && titleField.name).to.equal('title');
    expect(titleField && titleField.type).to.equal(GraphQLString);
    expect(titleField && titleField.type.name).to.equal('String');

    const authorField =
      isObjectType(articleFieldType) &&
      articleFieldType.getFields()[('author': string)];

    const authorFieldType = authorField ? authorField.type : null;
    const recentArticleField =
      isObjectType(authorFieldType) &&
      authorFieldType.getFields()[('recentArticle': string)];

    expect(recentArticleField && recentArticleField.type).to.equal(BlogArticle);

    const feedField = BlogQuery.getFields()[('feed': string)];
    expect(feedField && (feedField.type: GraphQLList).ofType).to.equal(
      BlogArticle,
    );
    expect(feedField && feedField.name).to.equal('feed');
  });

  it('defines a mutation schema', () => {
    const BlogSchema = new GraphQLSchema({
      query: BlogQuery,
      mutation: BlogMutation,
    });

    expect(BlogSchema.getMutationType()).to.equal(BlogMutation);

    const writeMutation = BlogMutation.getFields()[('writeArticle': string)];
    expect(writeMutation && writeMutation.type).to.equal(BlogArticle);
    expect(writeMutation && writeMutation.type.name).to.equal('Article');
    expect(writeMutation && writeMutation.name).to.equal('writeArticle');
  });

  it('defines a subscription schema', () => {
    const BlogSchema = new GraphQLSchema({
      query: BlogQuery,
      subscription: BlogSubscription,
    });

    expect(BlogSchema.getSubscriptionType()).to.equal(BlogSubscription);

    const sub = BlogSubscription.getFields()[('articleSubscribe': string)];
    expect(sub && sub.type).to.equal(BlogArticle);
    expect(sub && sub.type.name).to.equal('Article');
    expect(sub && sub.name).to.equal('articleSubscribe');
  });

  it('defines an enum type with deprecated value', () => {
    const EnumTypeWithDeprecatedValue = new GraphQLEnumType({
      name: 'EnumWithDeprecatedValue',
      values: { foo: { deprecationReason: 'Just because' } },
    });

    expect(EnumTypeWithDeprecatedValue.getValues()[0]).to.deep.equal({
      name: 'foo',
      description: undefined,
      isDeprecated: true,
      deprecationReason: 'Just because',
      value: 'foo',
      astNode: undefined,
    });
  });

  it('defines an enum type with a value of `null` and `undefined`', () => {
    const EnumTypeWithNullishValue = new GraphQLEnumType({
      name: 'EnumWithNullishValue',
      values: {
        NULL: { value: null },
        UNDEFINED: { value: undefined },
      },
    });

    expect(EnumTypeWithNullishValue.getValues()).to.deep.equal([
      {
        name: 'NULL',
        description: undefined,
        isDeprecated: false,
        deprecationReason: undefined,
        value: null,
        astNode: undefined,
      },
      {
        name: 'UNDEFINED',
        description: undefined,
        isDeprecated: false,
        deprecationReason: undefined,
        value: undefined,
        astNode: undefined,
      },
    ]);
  });

  it('defines an object type with deprecated field', () => {
    const TypeWithDeprecatedField = new GraphQLObjectType({
      name: 'foo',
      fields: {
        bar: {
          type: GraphQLString,
          deprecationReason: 'A terrible reason',
        },
      },
    });

    expect(TypeWithDeprecatedField.getFields().bar).to.deep.equal({
      type: GraphQLString,
      deprecationReason: 'A terrible reason',
      isDeprecated: true,
      name: 'bar',
      args: [],
    });
  });

  it('includes nested input objects in the map', () => {
    const NestedInputObject = new GraphQLInputObjectType({
      name: 'NestedInputObject',
      fields: { value: { type: GraphQLString } },
    });
    const SomeInputObject = new GraphQLInputObjectType({
      name: 'SomeInputObject',
      fields: { nested: { type: NestedInputObject } },
    });
    const SomeMutation = new GraphQLObjectType({
      name: 'SomeMutation',
      fields: {
        mutateSomething: {
          type: BlogArticle,
          args: { input: { type: SomeInputObject } },
        },
      },
    });
    const SomeSubscription = new GraphQLObjectType({
      name: 'SomeSubscription',
      fields: {
        subscribeToSomething: {
          type: BlogArticle,
          args: { input: { type: SomeInputObject } },
        },
      },
    });
    const schema = new GraphQLSchema({
      query: BlogQuery,
      mutation: SomeMutation,
      subscription: SomeSubscription,
    });
    expect(schema.getTypeMap().NestedInputObject).to.equal(NestedInputObject);
  });

  it("includes interfaces' subtypes in the type map", () => {
    const SomeInterface = new GraphQLInterfaceType({
      name: 'SomeInterface',
      fields: {
        f: { type: GraphQLInt },
      },
    });

    const SomeSubtype = new GraphQLObjectType({
      name: 'SomeSubtype',
      fields: {
        f: { type: GraphQLInt },
      },
      interfaces: [SomeInterface],
    });

    const schema = new GraphQLSchema({
      query: new GraphQLObjectType({
        name: 'Query',
        fields: {
          iface: { type: SomeInterface },
        },
      }),
      types: [SomeSubtype],
    });

    expect(schema.getTypeMap().SomeSubtype).to.equal(SomeSubtype);
  });

  it("includes interfaces' thunk subtypes in the type map", () => {
    const SomeInterface = new GraphQLInterfaceType({
      name: 'SomeInterface',
      fields: {
        f: { type: GraphQLInt },
      },
    });

    const SomeSubtype = new GraphQLObjectType({
      name: 'SomeSubtype',
      fields: {
        f: { type: GraphQLInt },
      },
      interfaces: () => [SomeInterface],
    });

    const schema = new GraphQLSchema({
      query: new GraphQLObjectType({
        name: 'Query',
        fields: {
          iface: { type: SomeInterface },
        },
      }),
      types: [SomeSubtype],
    });

    expect(schema.getTypeMap().SomeSubtype).to.equal(SomeSubtype);
  });

  it('stringifies simple types', () => {
    expect(String(GraphQLInt)).to.equal('Int');
    expect(String(BlogArticle)).to.equal('Article');
    expect(String(InterfaceType)).to.equal('Interface');
    expect(String(UnionType)).to.equal('Union');
    expect(String(EnumType)).to.equal('Enum');
    expect(String(InputObjectType)).to.equal('InputObject');
    expect(String(GraphQLNonNull(GraphQLInt))).to.equal('Int!');
    expect(String(GraphQLList(GraphQLInt))).to.equal('[Int]');
    expect(String(GraphQLNonNull(GraphQLList(GraphQLInt)))).to.equal('[Int]!');
    expect(String(GraphQLList(GraphQLNonNull(GraphQLInt)))).to.equal('[Int!]');
    expect(String(GraphQLList(GraphQLList(GraphQLInt)))).to.equal('[[Int]]');
  });

  it('identifies input types', () => {
    const expected = [
      [GraphQLInt, true],
      [ObjectType, false],
      [InterfaceType, false],
      [UnionType, false],
      [EnumType, true],
      [InputObjectType, true],
    ];
    expected.forEach(([type, answer]) => {
      expect(isInputType(type)).to.equal(answer);
      expect(isInputType(GraphQLList(type))).to.equal(answer);
      expect(isInputType(GraphQLNonNull(type))).to.equal(answer);
    });
  });

  it('identifies output types', () => {
    const expected = [
      [GraphQLInt, true],
      [ObjectType, true],
      [InterfaceType, true],
      [UnionType, true],
      [EnumType, true],
      [InputObjectType, false],
    ];
    expected.forEach(([type, answer]) => {
      expect(isOutputType(type)).to.equal(answer);
      expect(isOutputType(GraphQLList(type))).to.equal(answer);
      expect(isOutputType(GraphQLNonNull(type))).to.equal(answer);
    });
  });

  it('prohibits putting non-Object types in unions', () => {
    const badUnionTypes = [
      GraphQLInt,
      GraphQLNonNull(GraphQLInt),
      GraphQLList(GraphQLInt),
      InterfaceType,
      UnionType,
      EnumType,
      InputObjectType,
    ];
    badUnionTypes.forEach(x => {
      expect(() =>
        new GraphQLUnionType({ name: 'BadUnion', types: [x] }).getTypes(),
      ).to.throw(
        `BadUnion may only contain Object types, it cannot contain: ${x}.`,
      );
    });
  });

  it("allows a thunk for Union's types", () => {
    const union = new GraphQLUnionType({
      name: 'ThunkUnion',
      types: () => [ObjectType],
    });

    const types = union.getTypes();
    expect(types.length).to.equal(1);
    expect(types[0]).to.equal(ObjectType);
  });

  it('does not mutate passed field definitions', () => {
    const fields = {
      field1: {
        type: GraphQLString,
      },
      field2: {
        type: GraphQLString,
        args: {
          id: {
            type: GraphQLString,
          },
        },
      },
    };
    const testObject1 = new GraphQLObjectType({
      name: 'Test1',
      fields,
    });
    const testObject2 = new GraphQLObjectType({
      name: 'Test2',
      fields,
    });

    expect(testObject1.getFields()).to.deep.equal(testObject2.getFields());
    expect(fields).to.deep.equal({
      field1: {
        type: GraphQLString,
      },
      field2: {
        type: GraphQLString,
        args: {
          id: {
            type: GraphQLString,
          },
        },
      },
    });

    const testInputObject1 = new GraphQLInputObjectType({
      name: 'Test1',
      fields,
    });
    const testInputObject2 = new GraphQLInputObjectType({
      name: 'Test2',
      fields,
    });

    expect(testInputObject1.getFields()).to.deep.equal(
      testInputObject2.getFields(),
    );
    expect(fields).to.deep.equal({
      field1: {
        type: GraphQLString,
      },
      field2: {
        type: GraphQLString,
        args: {
          id: {
            type: GraphQLString,
          },
        },
      },
    });
  });
});

describe('Type System: List must accept only types', () => {
  const types = [
    GraphQLString,
    ScalarType,
    ObjectType,
    UnionType,
    InterfaceType,
    EnumType,
    InputObjectType,
    GraphQLList(GraphQLString),
    GraphQLNonNull(GraphQLString),
  ];

  const notTypes = [{}, String, undefined, null];

  types.forEach(type => {
    it(`accepts an type as item type of list: ${type}`, () => {
      expect(() => GraphQLList(type)).not.to.throw();
    });
  });

  notTypes.forEach(type => {
    it(`rejects a non-type as item type of list: ${type}`, () => {
      expect(() => GraphQLList(type)).to.throw(
        `Expected ${type} to be a GraphQL type.`,
      );
    });
  });
});

describe('Type System: NonNull must only accept non-nullable types', () => {
  const nullableTypes = [
    GraphQLString,
    ScalarType,
    ObjectType,
    UnionType,
    InterfaceType,
    EnumType,
    InputObjectType,
    GraphQLList(GraphQLString),
    GraphQLList(GraphQLNonNull(GraphQLString)),
  ];

  const notNullableTypes = [
    GraphQLNonNull(GraphQLString),
    {},
    String,
    undefined,
    null,
  ];

  nullableTypes.forEach(type => {
    it(`accepts an type as nullable type of non-null: ${type}`, () => {
      expect(() => GraphQLNonNull(type)).not.to.throw();
    });
  });

  notNullableTypes.forEach(type => {
    it(`rejects a non-type as nullable type of non-null: ${type}`, () => {
      expect(() => GraphQLNonNull(type)).to.throw(
        `Expected ${type} to be a GraphQL nullable type.`,
      );
    });
  });
});
