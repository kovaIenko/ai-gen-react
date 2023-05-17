import {getNextMessage} from "../repository/QuestionRepository";

const express = require('express');
import {Request, Response, Router} from 'express';
import {ChatType} from "../entity/ChatType";

import { v4 as uuid } from 'uuid';
import { evaluatePrompt, initPrompt } from "../repository/GptRepository";
//import { initPrompt } from "../repository/GptRepository";

const router: Router = express.Router();

const AWS = require('aws-sdk');

AWS.config.update({region: 'us-west-1'});

const dynamodb = new AWS.DynamoDB.DocumentClient();


router.get('/get', async (req: Request, res: Response) => {

  //todo add token verification here
  console.log("get request messages by chatId")
  const { chatId } = req.query;
  if(!chatId) {
    res.send({ messages: [] });
  }
  //console.log(chatId)
  const params = {
        TableName: 'messages',
        FilterExpression: 'chatId = :chatId',
        ExpressionAttributeValues: {
            ':chatId': chatId
        }
    };

    const paramsChat = {
      TableName: 'chats',
      Key: {
        'chatId': chatId
      }
    };

    try {
        
          const messages_response = await dynamodb.scan(params).promise();
     
         let chat_response = await dynamodb.get(paramsChat).promise();;
          // Process scan result here
         const chat  = chat_response.Item
       
        const messages = messages_response.Items;

        if(chat.description !== "Onboarding") {
            await caseNonUn(req, res, chat, messages)
            return;
        }

        const chatType = getChatType(chat);

      if (isNotLastMessageQuestionType(messages, chatType)) {

        const countAlreadAskedQuestion = messages.filter((message:any) => message.role === 'user').length;
        console.log("numb answered questions")
        console.log(countAlreadAskedQuestion)
        const question = await getNextMessage(chatType, countAlreadAskedQuestion, "lastAnswer")
        
        console.log(question)
        if(!question) {
          make_visible_chats(chat.email, chat.chatId)
          //update chats visible
          res.status(418).send("already done with onboarding");
          return;
        }
    
        const messageWithQuestion = {
          messageId: uuid(),
          chatId: chatId, 
          content: question.question,
          role: "assistant",
          createdAt: new Date().toISOString(),
       }
       console.log(new Date().toISOString())
       await store_message(messageWithQuestion);
       messages.push(messageWithQuestion);

        res.send({messages: messages ?? []});
          
        } else {
            res.send({messages: messages ?? []});
        }

    } catch (error: any) {
        console.error(error);
        console.log(error.response.data)
    }
});

function isNotLastMessageQuestionType(messages: any, chatType: ChatType): Boolean {
  console.log(chatType)
  //  if(chatType.valueOf()  === ChatType.Onboarding.valueOf()){
     if(messages.length===0) return true;

//      const dateString = "2023-05-14T09:25:35.335Z";
// const date = new Date(dateString);
// console.log(date);

     //console.log(messages.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))
      const lastMessage = messages.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[messages.length-1];

      console.log("lastMessage")
    
      console.log(lastMessage)
      return lastMessage.role === 'user'
  // }
  //  else{
  //    return false;
  //  }
}

// 1 = case
// 2 = evaluation
// 3 = nothing
function type(messages: any){
  console.log(messages)

  if(messages.length===0 ) return 1;
  
  const mgs = messages.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

  const ls = mgs[messages.length-1];
  if(messages.length>1 && ls.role === "assistant"){

  return 1;
  }

  if(ls.role == "user"){
      return 2
  }
  else return 3;
}


async function caseNonUn(req: Request, res: Response, chat: any, messages: any){
  //todo add token verification here
  console.log("get request messages by chatId for gpt")
  const { chatId } = req.query;
  if(!chatId) {
    res.send({ messages: [] });
  }

    try {
        console.log(chat.description)
        const typeOfResponse = type(messages); 
        console.log(typeOfResponse)
        if(typeOfResponse == 1){

          res.send({messages: messages ?? []});

          const test  = await initPrompt();

              const messageWithQuestion = {
                messageId: uuid(),
                chatId: chatId, 
                content: test.question,
                role: "assistant",
                createdAt: new Date().toISOString(),
             }
            await store_message(messageWithQuestion);
             messages.push(messageWithQuestion);
            
      

         res.send({messages: messages ?? []});

        } else if(typeOfResponse == 2){

          const sorted = messages.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

          const last = sorted[messages.length-1];

          const previouslast = sorted[messages.length-2];

          const a =  previouslast.con + "here answer of user: " + last.content; 
          
          // const userReponse = lastMessage.content;

          //console.log(userReponse);
          // send a request to chatgpt

         const e = await evaluatePrompt(a);

              const messageEvaluation = {
                messageId: uuid(),
                chatId: chatId, 
                content: e.question,
                role: "assistant",
                createdAt: new Date().toISOString(),
             }
    
             await store_message(messageEvaluation);
    
             messages.push(messageEvaluation);
    
    
         res.send({messages: messages ?? []});

        }
        else{
          res.send({messages: messages ?? []});
        }

    } catch (error: any) {
        console.error(error);
        console.log(error.response.data)
    }
}


function getChatType(chat: any): ChatType {
  const chatDescription = chat.description;
  return ChatType[chatDescription as keyof typeof ChatType];
}

router.post('/save', async (req: Request, res: Response) => {
  
  console.log("save messages request")
  const message = req.body.message;

    console.log(message)

    const params = {
        TableName: 'messages',
        Item: message
    }

    try {
        await dynamodb.put(params).promise();
        res.send({success: true});

    } catch (error: any) {
        console.error(error);
        console.log(error.response.data)
    }
});


async function store_message(message: any){
  const params = {
    TableName: 'messages',
    Item: message
}
try {
  await dynamodb.put(params).promise();
} catch (error: any) {
  console.error(error);
  console.log(error.response.data)
}
}

async function make_visible_chats(email: any, onboarding_chat_id: string){

  console.log(onboarding_chat_id)
  const scanParams = {
    TableName: "chats",
    FilterExpression: `email = :email`,
    ExpressionAttributeValues: { ':email': email }
  };
  
  await dynamodb.scan(scanParams, (err: any, data: any) => {
    if (err) {
      console.error('Unable to scan table:', JSON.stringify(err, null, 2));
    } else {
      // If one or more items were found, update the desired field(s) for each item
      if (data.Count > 0) {
        data.Items.forEach((item: any) => {
          const updateParams = {
            TableName: "chats",
            Key: { 'chatId': item.chatId },
            UpdateExpression: `set isVisible = :updateValue`,
            ExpressionAttributeValues: { ':updateValue': true }
          };
  
          dynamodb.update(updateParams, (err: any, data: any) => {
            if (err) {
              console.error(`Unable to update item ${item.chatId}:`, JSON.stringify(err, null, 2));
            } else {
              console.log(`Update succeeded for item ${item.chatId}:`, JSON.stringify(data, null, 2));
            }
          });
        });
      } else {
        console.log("-")
        //console.log(`No items found for ${searchAttribute}=${searchValue}`);
      }
    }
});

const updateParamsOnboarding = {
  TableName: "chats",
  Key: { 'chatId': onboarding_chat_id },
  UpdateExpression: `set isVisible = :updateValue`,
  ExpressionAttributeValues: { ':updateValue': false }
};

await dynamodb.update(updateParamsOnboarding, (err: any, data: any) => {
  if (err) {
    console.log(data)
    //console.error(`Unable to update item ${item.chatId}:`, JSON.stringify(err, null, 2));
  } else {
    console.log(`Update succeeded for item ${onboarding_chat_id}:`, JSON.stringify(data, null, 2))
    //console.log(`Update succeeded for item ${item.chatId}:`, JSON.stringify(data, null, 2));
  }
});

};




export default router;
