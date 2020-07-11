

const express = require("express");
const pug = require("pug");
const app = express();
var bodyParser = require('body-parser');


//Set view engine and tell express where to look for views
app.use(express.static(__dirname + '/public'));
app.use('/public', express.static(__dirname + '/public'));
app.set('views', './views');
app.set('view engine', 'pug');
app.use(bodyParser.urlencoded({extended: true}));

app.get('/', (req, res) => {
  res.render('index');
})

const port = 3000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});