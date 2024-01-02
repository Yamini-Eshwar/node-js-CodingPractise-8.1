const express = require('express')
const app = express()
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const bcrypt = require('bcrypt')
const path = require('path')
const dbPath = path.join(__dirname, 'userData.db')

app.use(express.json())

let db = null
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
  } catch (e) {
    console.log('DB Error message ${e.message}')
    process.exit(1)
  }
}

app.listen(3000, () => {
  console.log('Server running at http://localshost:3000/')
})

initializeDBAndServer()

app.post('/register', async (request, response) => {
  const {username, name, password, gender, location} = request.body
  const hashedPasword = await bcrypt.hash(password, 10)
  const selectUserQuery = `SELECT * FROM user WHERE username='${username}';`
  const dbUser = await db.get(selectUserQuery)
  if (dbUser === undefined) {
    const createUserQuery = `INSERT INTO user(username,name,password,gender,location) VALUES ('${username}',
    '${name}',
    '${hashedPasword}',
    '${gender}',
    '${location}');`
    if (password.length > 4) {
      await db.run(createUserQuery)
      response.send('User created successfully')
    } else {
      response.status(400)
      response.send('Password is too short')
    }
  } else {
    response.status(400)
    response.send('User already exists')
  }
})

app.post('/login', async (request, response) => {
  const {username, password} = request.body
  const hashedPasword = await bcrypt.hash(password, 10)
  const selectUserQuery = `SELECT * FROM user WHERE username='${username}';`
  const dbUser = await db.get(selectUserQuery)
  if (dbUser === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password)
    if (isPasswordMatched) {
      response.send('Login success!')
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  }
})

app.put('/change-password', async (request, response) => {
  const {username, oldPassword, newPassword} = request.body
  const selectUserQuery = `SELECT * FROM user WHERE username='${username}';`
  const dbUser = await db.get(selectUserQuery)
  if (dbUser === undefined) {
    response.send('Invalid user')
  } else {
    const isPasswordMatched = await bcrypt.compare(oldPassword, dbUser.password)
    if (isPasswordMatched) {
      if (newPassword.length > 4) {
        const hashedPasword = await bcrypt.hash(newPassword, 10)
        const updatePasswordQuery = `UPDATE user SET password='${hashedPasword}' WHERE username='${username}';`
        await db.run(updatePasswordQuery)
        response.send('Password updated')
      } else {
        response.send('Password is too short')
      }
    } else {
      response.send('Invalid current password')
    }
  }
})
module.exports = app
