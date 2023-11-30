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

# User

### `GET /user:id @UserTokenControl`
---
### `POST /user @MD5Control`
```json
{
    "firstName":"", @String @required
    "lastName":"", @String @required
    "email":"", @String @required
    "password":"", @String @required
    "budget":0.0 @Double
}
```
---
### `DELETE /user:id @UserTokenControl`
---
### `PUT /user/buy @UserTokenControl`

```json
{
    "userId":"", @String @required
    "ticketId":"", @String @required
}
```
---
### `PUT /user/sell @UserTokenControl`

```json
{
    "userId":"", @String @required
    "ticketId":"", @String @required
}
```
---
# Team

### `GET /team:id @MD5Control`
---
### `POST /team @AdminTokenControl`
```json
{
    "name":"", @String @required
    "shortName":"", @String @required
    "logo":"" @Base64String
}
```
---
### `DELETE /team:id @AdminTokenControl`
---
### `PUT/team @AdminTokenControl`
```json
{
	"id":"", @String @required
    "name":"", @String
    "shortName":"", @String
    "logo":"" @Base64String
}
```
---
# Match

### `GET /match:id @MD5Control`
---
### `GET /match @MD5Control`
---
### `POST /match @AdminTokenControl`
```json
{
    "teams":[], @[String] @required
    "date":"", @String @required
    "stadium":"" @String @required
    "categories":[ @required
	    {
		    "name":"", @String @required
		    "price":0.0, @Double @required
		    "capacity":0 @Integer @required
	    }
    ]
}
```
---
### `PUT /match @AdminTokenControl`
```json
{
    "id":"", @String @required
    "date":"", @String
    "stadium":"" @String
}
```
---
### `POST /match/category @AdminTokenControl`
```json
{
    "matchId":"", @String @required
    "category":{ @required
		"name":"", @String @required
		"price":0.0, @Double @required
		"capacity":0 @Integer @required
    }
}
```
