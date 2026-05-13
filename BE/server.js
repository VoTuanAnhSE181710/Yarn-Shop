import app from "./app.js";
import db from "./src/config/db.js"
import http from "http";
import { configDotenv } from "dotenv";
import { setupContainer } from "./container.js";
import { initializeSocket } from "./src/socket/socket.js";
configDotenv();


const PORT = process.env.PORT || 3000;

const server = http.createServer(app);//giúp server linh hoạt hơn
//chuyển từ webframeword sang web server thực

const { io, notificationNamespace, chatNamespace } = initializeSocket(server)

//setup container
setupContainer({ io, notificationNamespace, chatNamespace });

//models
import './src/models/Model.js'

//connect db
db().then(() => {
    console.log(`Connect to DB successfully`);

    server.listen(PORT, () => {
        console.log(` 
 ╔════════════════════════════════════════════════════════╗
                                                       
   🚀 Server is running on port ${PORT}                  
   📚 API Docs: http://localhost:${PORT}/api-docs
   📊 Database: Connected                                 
                                                         
 ╚════════════════════════════════════════════════════════╝`);
    })
}).catch((err) => {
    console.log(`Error is: ${err}`);
})