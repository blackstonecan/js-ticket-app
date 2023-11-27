# JS Ticket App
This is a ticket app which admins can create teams and matches, also users can register, buy and sell tickets with a couple of authorization methods.

## Requirements
- Node and npm
- Local or cloud mongodb storage

## Installation
```sh
npm i
npm run dev
```

## Usage
### Authorization 
There are three authorization methods.
- First one is md5 control which is server and client have same SECRET KEY. Client's and server's hashed strings are compared eachother.
- Second and third ones are controlling with token. Different SECRET KEYs can be used for user and admin token.  Header should contain `"Authorization":"Bearer ${token}`.

### Endpoints and parameters
It runs in localhost's 5000 PORT defaultly. 

### User

### `GET /user:id`
---
### `POST /user`

| Parameter   | Type    | Required |
|-------------|---------|----------|
| `firstName` | String  | Yes      |
| `lastName`  | String  | Yes      |
| `email`     | String  | Yes      |
| `password`  | String  | Yes  	   |
| `budget`    | Double  | No       |
---
### `DELETE /user:id`
---
### `PUT /user/buy`

| Parameter   | Type    | Required |
|-------------|---------|----------|
| `userId`    | String  | Yes      |
| `ticketId`  | String  | Yes      |
---
### `PUT /user/sell`

| Parameter   | Type    | Required |
|-------------|---------|----------|
| `userId`    | String  | Yes      |
| `ticketId`  | String  | Yes      |
---
### Team

### `GET /team:id`
---
### `POST /team`

| Parameter   | Type    | Required |
|-------------|---------|----------|
| `name` | String  | Yes      |
| `shortName`  | String  | Yes      |
| `logo`     | Base64 String  | Yes      |
---
### `DELETE /team:id`
---
### `PUT/team`

| Parameter   | Type    | Required |
|-------------|---------|----------|
| `id` | String  | Yes      |
| `name` | String  | Yes      |
| `shortName`  | String  | Yes      |
| `logo`     | Base64 String  | Yes      |
---
### 
