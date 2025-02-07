import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class BackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create API Gateway
    const api = new apigateway.RestApi(this, 'EcommerceApi', {
      restApiName: 'EcommerceApi',
      description: 'E-commerce API for managing cart, products, orders, and users',
    });

    // Define models first
    const cartModel = api.addModel('CartModel', {
      contentType: 'application/json',
      modelName: 'CartModel',
      schema: {
        type: apigateway.JsonSchemaType.OBJECT,
        properties: {
          cartId: { type: apigateway.JsonSchemaType.STRING },
          items: {
            type: apigateway.JsonSchemaType.ARRAY,
            items: {
              type: apigateway.JsonSchemaType.OBJECT,
              properties: {
                productId: { type: apigateway.JsonSchemaType.STRING },
                quantity: { type: apigateway.JsonSchemaType.NUMBER },
                price: { type: apigateway.JsonSchemaType.NUMBER },
              },
            },
          },
          total: { type: apigateway.JsonSchemaType.NUMBER },
        },
      },
    });

    const productModel = api.addModel('ProductModel', {
      contentType: 'application/json',
      modelName: 'ProductModel',
      schema: {
        type: apigateway.JsonSchemaType.OBJECT,
        properties: {
          productId: { type: apigateway.JsonSchemaType.STRING },
          name: { type: apigateway.JsonSchemaType.STRING },
          price: { type: apigateway.JsonSchemaType.NUMBER },
          description: { type: apigateway.JsonSchemaType.STRING },
        },
      },
    });

    const orderModel = api.addModel('OrderModel', {
      contentType: 'application/json',
      modelName: 'OrderModel',
      schema: {
        type: apigateway.JsonSchemaType.OBJECT,
        properties: {
          orderId: { type: apigateway.JsonSchemaType.STRING },
          userId: { type: apigateway.JsonSchemaType.STRING },
          items: {
            type: apigateway.JsonSchemaType.ARRAY,
            items: {
              type: apigateway.JsonSchemaType.OBJECT,
              properties: {
                productId: { type: apigateway.JsonSchemaType.STRING },
                quantity: { type: apigateway.JsonSchemaType.NUMBER },
              },
            },
          },
          total: { type: apigateway.JsonSchemaType.NUMBER },
          status: { type: apigateway.JsonSchemaType.STRING },
          createdAt: { type: apigateway.JsonSchemaType.STRING },
        },
      },
    });

    const userModel = api.addModel('UserModel', {
      contentType: 'application/json',
      modelName: 'UserModel',
      schema: {
        type: apigateway.JsonSchemaType.OBJECT,
        properties: {
          userId: { type: apigateway.JsonSchemaType.STRING },
          email: { type: apigateway.JsonSchemaType.STRING },
          name: { type: apigateway.JsonSchemaType.STRING },
        },
      },
    });

    const checkoutResponseModel = api.addModel('CheckoutResponseModel', {
      contentType: 'application/json',
      modelName: 'CheckoutResponseModel',
      schema: {
        type: apigateway.JsonSchemaType.OBJECT,
        properties: {
          orderId: { type: apigateway.JsonSchemaType.STRING },
          status: { type: apigateway.JsonSchemaType.STRING },
          total: { type: apigateway.JsonSchemaType.NUMBER },
          timestamp: { type: apigateway.JsonSchemaType.STRING },
        },
        required: ['orderId', 'status', 'total', 'timestamp'],
        additionalProperties: false,
      },
    });

    // Create /cart resource
    const cartResource = api.root.addResource('cart');

    // Mock integration response template
    const mockIntegration = new apigateway.MockIntegration({
      integrationResponses: [{
        statusCode: '200',
        responseTemplates: {
          'application/json': JSON.stringify({
            message: 'Success',
            timestamp: '$context.requestTime'
          })
        },
      }],
      requestTemplates: {
        'application/json': '{ "statusCode": 200 }'
      },
    });

    // Add methods to /cart
    cartResource.addMethod('GET', mockIntegration, {
      operationName: 'GetCart',
      methodResponses: [{
        statusCode: '200',
        responseModels: {
          'application/json': cartModel,
        },
      }]
    });

    // Create /cart/checkout resource
    const checkoutResource = cartResource.addResource('checkout');
    checkoutResource.addMethod('POST', mockIntegration, {
      operationName: 'CheckoutCart',
      methodResponses: [{
        statusCode: '200',
        responseModels: {
          'application/json': checkoutResponseModel,
        },
      }]
    });

    // Create /cart/clear resource
    const clearResource = cartResource.addResource('clear');
    clearResource.addMethod('POST', mockIntegration, {
      operationName: 'ClearCart',
      methodResponses: [{
        statusCode: '200',
        responseModels: {
          'application/json': apigateway.Model.EMPTY_MODEL,
        },
      }]
    });

    // Create /products resource
    const productsResource = api.root.addResource('products');
    
    // Add methods to /products
    productsResource.addMethod('GET', mockIntegration, {
      operationName: 'ListProducts',
      methodResponses: [{
        statusCode: '200',
        responseModels: {
          'application/json': productModel,
        },
      }]
    });

    // Create /products/{productId} resource
    const productResource = productsResource.addResource('{productId}');
    productResource.addMethod('GET', mockIntegration, {
      operationName: 'GetProduct',
      methodResponses: [{
        statusCode: '200',
        responseModels: {
          'application/json': productModel,
        },
      }]
    });

    // Create /orders resource
    const ordersResource = api.root.addResource('orders');
    
    // Add methods to /orders
    ordersResource.addMethod('GET', mockIntegration, {
      operationName: 'ListOrders',
      methodResponses: [{
        statusCode: '200',
        responseModels: {
          'application/json': apigateway.Model.EMPTY_MODEL,
        },
      }]
    });

    // Create /orders/{orderId} resource
    const orderResource = ordersResource.addResource('{orderId}');
    orderResource.addMethod('GET', mockIntegration, {
      operationName: 'GetOrder',
      methodResponses: [{
        statusCode: '200',
        responseModels: {
          'application/json': orderModel,
        },
      }]
    });

    // Create /users resource
    const usersResource = api.root.addResource('users');
    
    // Create /users/me resource
    const userMeResource = usersResource.addResource('me');
    userMeResource.addMethod('GET', mockIntegration, {
      operationName: 'GetCurrentUser',
      methodResponses: [{
        statusCode: '200',
        responseModels: {
          'application/json': userModel,
        },
      }]
    });

    // Create /users/me/orders resource
    const userOrdersResource = userMeResource.addResource('orders');
    userOrdersResource.addMethod('GET', mockIntegration, {
      operationName: 'ListUserOrders',
      methodResponses: [{
        statusCode: '200',
        responseModels: {
          'application/json': apigateway.Model.EMPTY_MODEL,
        },
      }]
    });
  }
}
