import * as AWS from 'aws-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { createLogger } from '../utils/logger'
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate';
import { String } from 'aws-sdk/clients/acm';

const AWSXRay = require('aws-xray-sdk')

const XAWS = AWSXRay.captureAWS(AWS)

const logger = createLogger('TodosAccess')

// TODO: Implement the dataLayer logic

export class TodosAccess {

    constructor(
      private readonly docClient: DocumentClient = createDynamoDBClient(),
      private readonly todosTable = process.env.TODOS_TABLE,
      private readonly todosUserIndex = process.env.TODOS_USER_INDEX) {
    }
  
    async getAllTodos(userId : String): Promise<TodoItem[]> {

      logger.info('Getting all todos for ' + userId)

      const result = await this.docClient.query({
        TableName: this.todosTable,
        IndexName: this.todosUserIndex,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        }
      }).promise();
      
      const items = result.Items
      return items as TodoItem[]
    }

    async createTodo(todo: TodoItem): Promise<TodoItem> {
      await this.docClient.put({
        TableName: this.todosTable,
        Item: todo
      }).promise()
      
      logger.info('Updating all todos for ', todo)
      return todo
    }

    async updateTodo(todoUpdate: TodoUpdate, todoId: String,userId : String): Promise<any> {
        await this.docClient.update({
          TableName: this.todosTable,
          Key: {
            userId : userId,
            todoId: todoId
          },
          UpdateExpression: "set #name = :name, dueDate = :dueDate ,done = :done",
          ExpressionAttributeNames: {
            "#name": "name"
          },
          ExpressionAttributeValues: {
              ":name": todoUpdate.name,
              ":dueDate" : todoUpdate.dueDate,
              ":done" : todoUpdate.done,
          }
        }).promise()
    
        return {}
    }

    async updateAttachmentUrl(todoId: String, attachmentUrl : string,userId : String) {
      await this.docClient.update({
        TableName: this.todosTable,
        Key: {
          userId: userId,
          todoId: todoId
        },
        UpdateExpression: "set attachmentUrl = :attachmentUrl",
        ExpressionAttributeValues: {
            ":attachmentUrl": attachmentUrl,
  
        }
      }).promise()

  }

    async deleteTodo(todoId: String,userId : String): Promise<any> {
        await this.docClient.delete({
          TableName: this.todosTable,
          Key: {
            userId : userId,
            todoId : todoId,
          }
        }).promise()
    
        return ''
    }

    async todoExists(todoId: string,userId : String): Promise<Boolean> {
        const result = await this.docClient
          .get({
            TableName: this.todosTable,
            Key: {
              userId: userId,
              todoId: todoId
            }
          })
          .promise()
      
        
      logger.info('Getting todo',result)

        return !!result.Item
      }

   async getTodo(todoId: String,userId : String): Promise<any> {
      const result =  await this.docClient.get({
          TableName: this.todosTable,
          Key: {
            userId: userId,
            todoId: todoId
          }
        }).promise()

        const item = result.Item

        return item as TodoItem
    }


  }
  
  function createDynamoDBClient() {
    if (process.env.IS_OFFLINE) {
      console.log('Creating a local DynamoDB instance')
      return new XAWS.DynamoDB.DocumentClient({
        region: 'localhost',
        endpoint: 'http://localhost:8000'
      })
    }
  
    return new XAWS.DynamoDB.DocumentClient()
  }
  