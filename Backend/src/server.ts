import express, {
  type Request,
  type Response,
} from "express";
import cors from "cors";
import "./config/firebase.js";
import userRoutes from "./routes/user.routes.js";
import authRoutes from "./routes/authRoutes.js";
import reportRoutes from "./routes/report.routes.js";
import sessionRoutes from "./routes/session.routes.js";
import "dotenv/config";

const app = express();

app.use(cors());
app.use(express.json({ limit: "8mb" })); // AI Scan reports carry the photo (base64)

app.use('/api', authRoutes);

app.get("/",(req: Request,res: Response) => {
    res.json({
        message: "Smartheal backend is running",
    });
});

app.use("/api/users", userRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/sessions", sessionRoutes);

app.get("/api/test", (req: Request,res: Response) => {
    res.json({
        success: true,
        message: "API is working",
    });
});



const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`server is running on port ${PORT}`);
});
