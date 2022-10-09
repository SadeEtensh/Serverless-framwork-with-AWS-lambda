import { TodosAccess } from '../dataLayer/todosAcess'
import { createSignedUrl ,generateAttachmentUrl} from '../dataLayer/attachmentUtils';
import { TodoItem } from '../models/TodoItem'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
// import { createLogger } from '../utils/logger'
import * as uuid from 'uuid'
// import * as createError from 'http-errors'
// import { parseUserId } from '../auth/utils'

// TODO: Implement businessLogic

const todoAccess = new TodosAccess();

export async function getAllTodos(userId:string): Promise<TodoItem[]> {

  return await todoAccess.getAllTodos(userId);
}

export async function createTodo(
    CreateTodoRequest: CreateTodoRequest,
   userId: string
): Promise<TodoItem> {

  const todoId = uuid.v4()
  const url = null;

  return await todoAccess.createTodo({
    todoId: todoId,
    userId: userId,
    name: CreateTodoRequest.name,
    dueDate: CreateTodoRequest.dueDate,
    createdAt : new Date().toISOString(),
    done: false,
    attachmentUrl: url
  })
}

export async function UpdateTodo(
  UpdateTodoRequest: UpdateTodoRequest,
  todoId: string,
  userId: string
): Promise<any> {

    const validTodoId = await todoAccess.todoExists(todoId,userId);

    if (!validTodoId) {
        return {
          statusCode: 404,
          body: JSON.stringify({
            error: 'Todo does not exist'
          })
        }
      }
    
    const todo = await todoAccess.getTodo(todoId,userId);

    if(todo.userId !== userId) {
      return {
        statusCode: 403,
        body: JSON.stringify({
          error: 'User ' + userId + ' did not have the permission'
        })
      }
    }

    return await todoAccess.updateTodo(UpdateTodoRequest,todoId,userId);


}


export async function deleteTodo(
    todoId: string,
    userId: string
): Promise<any> {

    const validTodoId = await todoAccess.todoExists(todoId,userId);

    if (!validTodoId) {
        return {
          statusCode: 404,
          body: JSON.stringify({
            error: 'Todo does not exist'
          })
        }
      }
    
    const todo = await todoAccess.getTodo(todoId,userId);
    if(todo.userId !== userId) {
      return {
        statusCode: 403,
        body: JSON.stringify({
          error: 'User ' + userId + ' did not have the permission'
        })
      }
    }

    return await todoAccess.deleteTodo(todoId,userId);
}


export async function createAttachmentPresignedUrl(
  todoId: string,
  userId: string
): Promise<any> {

  const validTodoId = await todoAccess.todoExists(todoId,userId);

  if (!validTodoId) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          error: 'Todo does not exist'
        })
      }
    }
  
  const todo = await todoAccess.getTodo(todoId,userId);
  if(todo.userId !== userId) {
    return {
      statusCode: 403,
      body: JSON.stringify({
        error: 'User ' + userId +'=' + todo.userId + ' did not have the permission',
      })
    }
  }

  const signedUrl = await createSignedUrl(todoId);

  const attachmentUrl = await generateAttachmentUrl(todoId);

  await todoAccess.updateAttachmentUrl(todoId,attachmentUrl,userId);

  return {
    statusCode: 200,
    body: JSON.stringify({
      uploadUrl: signedUrl
    })
  }
}