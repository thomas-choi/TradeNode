# TradeNode
Node.js as the gateway to an HTML/5 front-end application. Data was transported via web-socket received by an HTML/5 browser and displayed in the stock chart by JavaScript.

- controllers
    - home.js       http request routers of the app are defined here
    - realtime.js   the server-side javascript code for simulations' UI

- public
    - javascripts
        - main.js   the client-side javascript code for simulations's UI
    -stylesheets
        - style.css the main stylesheet for simulations' UI
        
- views
    - index.jade    the template file for generating the HTML of simulations' UI 
    - layout.jade   the layout template file for index.jade
    
