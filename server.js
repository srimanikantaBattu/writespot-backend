const express = require('express');
const cors=require('cors');
const {connect} = require('mongoose');
const upload = require('express-fileupload')
require('dotenv').config();

const userRoutes = require('./APIs/userRoutes');
const postRoutes = require('./APIs/postRoutes');
const {notFound,errorHandler} = require('./Middlewares/errorMiddleware')

const app=express();
app.use(express.json({extended:true}))
app.use(express.urlencoded({extended:true}))
// app.use(cors({credentials:true,origin:"http://localhost:3000"}));

app.use(upload());
app.use('/uploads', express.static(__dirname+'/uploads'))


app.use('/api/users',userRoutes)
app.use('/api/posts',postRoutes)



app.use(notFound)
app.use(errorHandler);


connect(process.env.DB_URL).then(app.listen(process.env.PORT || 5000,()=>console.log(`Server running on port ${process.env.PORT}`))).catch(err=>console.log(err))
