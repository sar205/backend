const mongoose = require('mongoose');

mongoose.connect("mongodb://127.0.0.1:27017/DyanmicWebiste")
.then(() =>{
    console.log("DataBase is connect");
})
.catch((error) =>{
    console.log(error);
})