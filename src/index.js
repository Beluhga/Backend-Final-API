const express = require("express");

// v4 gera numero randomicos
// Ctrl + espaço para ver a lista dentro das chaves "{}"
const {v4: uuidv4 } = require("uuid")


const app = express();

app.use(express.json());

const customers = [];

/**
 ---- O que irar receber do cliente ----
 *  cpf - string
 *  name- string
 *  id - uuid
 *  statement []
 */

 //Middlewares
 function verifyIfExistsAccountCPF(request, response, next){
    const { cpf } = request.headers;

    const customer = customers.find(customer => 
        customer.cpf === cpf)

         // validando a conta
         if(!customer){
            return response.status(400).json({error: "Usuario não existe"});
        }

        // para passar o verifyIfExistsAccountCPF para as demais rotas do middlewares
        request.customer = customer;

        return next();

 }

 // função para balanço com o valor que tem dentro da conta para pode fazer o saque
 function getBalance(statement) {
    // pegar os valores determinado em um unico valor
    // acc = acumulador
    const balance = statement.reduce((acc, operation) => {
        if(operation.type === 'credit'){
            return acc + operation.amount;
        } else {
            return acc - operation.amount;
        }
        // colocar o valor inicial, neste caso = 0
    }, 0)

    return balance;
 }

app.post("/account", (request, response) => {
    const {cpf, name} = request.body;

    //Não deve ser possível cadastrar uma conta com CPF já existente
    const customerAlreadyExists = customers.some(
        (customer) => customer.cpf === cpf
        );

        if(customerAlreadyExists) {
            return response.status(400)
            .json(
            {error: "Cpf ja existe!"}
                )
        }

    customers.push({
        //Deve ser possível criar uma conta
        id: uuidv4(),
        cpf,
        name,
        statement: []
    });

    // .send: não retorna informção, so avisa que esta tudo certo
    return response.status(201).send()
});

 //Middlewares
 // para que todas as rotas tenha o Middleware
// app.use(verifyIfExistsAccountCPF);

// Deve ser possível buscar o extrato bancário do cliente
app.get("/statement", verifyIfExistsAccountCPF, (request, response) => {
    const { customer } = request;

    return response.json(customer.statement)
});

//Deve ser possível realizar um depósito
//Não deve ser possível buscar extrato em uma conta não existente
app.post("/deposit", verifyIfExistsAccountCPF, (request, response) => {
    // descrição e valor
    const { description, amount} = request.body;

    const { customer} = request;

    const statementOperation= {
        description,
        amount,
        created_at: new Date(),
        type: "credit"
    }

    // passando a operação dentro do customer
    customer.statement.push(statementOperation);

    return response.status(201).send();
});

// Deve ser possível realizar um saque
// Não deve ser possível fazer saque em uma conta não existente
// Não deve ser possível fazer saque quando o saldo for insuficiente
app.post("/withdraw", verifyIfExistsAccountCPF, (request, response) =>{
    // quantia
    const { amount } = request.body;
    const { customer} = request;

    const balance = getBalance(customer.statement);

    if(balance < amount) {
        return response.status(400).json({ error: "Dinheiro insuficiente!"})
    }

    const statementOperation = {
        amount,
        created_at: new Date(),
        type: "debit",
    };

    customer.statement.push(statementOperation);

    return response.status(201).send();
})

app.get("/statement/date", verifyIfExistsAccountCPF, (request, response) => {
    const { customer } = request;
    const { date } = request.query;

    const dateFormat = new Date(date + " 00:00");

    // para retorna somente o extrato bancario do dia
    const statement = customer.statement.filter((statement) => 
    statement.created_at.toDateString() === new Date(dateFormat).toDateString())

    // se ele for encontrado, sera retornado
    return response.json(statement)
});

//Deve ser possível atualizar dados da conta do cliente
app.put("/account", verifyIfExistsAccountCPF, (request, response) => {
    const { name } = request.body;
    const { customer} = request;

    customer.name = name;

    return response.status(201).send()
})

// Deve ser possível obter dados da conta do cliente
app.get("/account", verifyIfExistsAccountCPF, (request, response) => {
    const { customer} = request;

    return response.json(customer);
});

// Deve ser possível deletar uma conta
// Não deve ser possível excluir uma conta não existente
app.delete("/account", verifyIfExistsAccountCPF, (request, response) => {
const { customer } = request;

//splice = remoção - irar remover esse custumer (1)
customers.splice(customer, 1);
    
  return response.status(200).json(customers);
});

app.get("/balance", verifyIfExistsAccountCPF, (request, response) =>{
    const { customer} = request;

    const balance = getBalance(customer.statement);

    return response,json(balance);
} )

app.listen(3333);

/**
  FinAPI - Financeira

—

### Requisitos

[x] Deve ser possível criar uma conta
[x] Deve ser possível buscar o extrato bancário do cliente
[x] Deve ser possível realizar um depósito
[x] Deve ser possível realizar um saque
[x] Deve ser possível buscar o extrato bancário do cliente por data
[x] Deve ser possível atualizar dados da conta do cliente
[x] Deve ser possível obter dados da conta do cliente
[x] Deve ser possível deletar uma conta
[x]  Deve ser possível retornar o balance
—

## Regras de negócio

[x] Não deve ser possível cadastrar uma conta com CPF já existente
[x] Não deve ser possível fazer depósito em uma conta não existente
[x] Não deve ser possível buscar extrato em uma conta não existente
[x] Não deve ser possível fazer saque em uma conta não existente
[x] Não deve ser possível excluir uma conta não existente
[x] Não deve ser possível fazer saque quando o saldo for insuficiente

 */