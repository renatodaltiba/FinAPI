const { request, response } = require('express');
const express = require('express');
const { v4: uuidv4 } = require('uuid')

const app = express();

app.use(express.json())

const customers = [];

// Middleware

function verifyIfExistsAccountCPF(request, response, next){
    const { cpf } = request.headers;

    const customer = customers.find((customer) => customer.cpf === cpf )

    if(!customer){
        return response.status(400).json({ error: "Customer not found" })
    }

    request.customer = customer;


    return next();

    
}
function getBalance(statement){
    const balance = statement.reduce((acc, operation) => {
        if( operation.type === 'credit'){
            return acc + operation.amount;
        }else{
            return acc - operation.amount;
        }
    }, 0)

    return balance;
}

//CRUD
app.post('/account', function (req, res) {
  const {cpf, name} = req.body;

  const costumerAlreadyExists = customers.some((customer) => customer.cpf === cpf);
   
 if(costumerAlreadyExists == false ){
  customers.push({
      cpf,
      name,
      id: uuidv4(),
      statement: []
  });

  return res.status(201).send();
    }else{
        return res.status(400).json({error: "CUSTOMER ALREADY EXISTS!"})
    }
})
app.put('/account', verifyIfExistsAccountCPF, function(req, res) {
    const { name } = req.body;
    const { customer } = request;

    customer.name = name;

    return response.status(201).send()

})
app.get('/account', verifyIfExistsAccountCPF, function(req, res) {
    const { customer } = request;

    return response.json(customer)

})
app.delete('/account', verifyIfExistsAccountCPF, function(req, res) {
    const { customer } = request;

    customers.splice(customer, 1);

    return res.status(204);
})
app.get('/balance', verifyIfExistsAccountCPF, function(req, res){
    const {customer} = req;
    const balance = getBalance(customer.statement);

    return res.json(balance)
})
app.get('/statement', verifyIfExistsAccountCPF, (req, res) => {
        const { customer } = req;
        return res.json(customer.statement)
})
app.post('/deposit', verifyIfExistsAccountCPF, (req, res)=> {
    const { amount, description } = req.body;

    const {customer} = req;
    const balance = getBalance(customer.statement)
    const statementOperation = { 
        description,
        amount,
        created_at: new Date(),
        type: "credit"
    }

    customer.statement.push(statementOperation)
    
    return res.status(201).send();
})
app.post('/withdraw',verifyIfExistsAccountCPF, function (req, res) {
  const { amount } = req.body;
  
  const { customer } = req;

  const balance = getBalance(customer.statement);
  if(balance < amount ){
      res.status(400).json({ error: "Saldo Insuficiente"})
  }
  const statementOperation = {
      amount,
      created_at: new Date(),
      type: "debit"
  }

  customer.statement.push(statementOperation)

  return res.status(201).send();

})
app.get('/statement/date', verifyIfExistsAccountCPF, (req, res) => {   
    const { customer } = req;

    const { date } = req.query;

    const dateFormat = new Date(date + " 00:00");

    const statement = customer.statement.filter((statement) => statement.created_at.
    toDateString() === new Date(dateFormat).toDateString())

    return res.json(statement)
})
app.listen(3333)