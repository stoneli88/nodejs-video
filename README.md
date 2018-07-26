# Video Server

We using DOCKER to deploy every role of server include:

1. Prisma(GraphQL)
2. FFmpeg+BeeQueue
3. Redis
4. MySQL
5. FrontEnd(manager)

## Prisma

### Setup Prisma with a new MySQL Database

`npm install -g prisma`

`cd docker && docker-compose up -d`

`prisma deploy`

### Setup Prisma with a exists MySQL Database

Past following contents into the docker-compose.yml
`
connector: mysql
host: __YOUR_MYSQL_HOST__
port: __YOUR_MYSQL_PORT__
user: __YOUR_MYSQL_USER__
password: __YOUR_MYSQL_PASSWORD__
`
