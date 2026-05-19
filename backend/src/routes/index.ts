import express, { Request, Response } from 'express';
import { db } from '../db';
import { diagnosis } from '../db/schema';

export const router = express.Router();

router.post('/', async (req: Request, res: Response) => {
    try {
        const data = req.body;

        const resultat = await db.insert(diagnosis).values({
            // 1. L'Enfant
            childFirstName: data.childFirstName,
            childLastName: data.childLastName,
            childBirthDate: data.childBirthDate,
            consultationReason: data.consultationReason,

            // 2. Les Tableaux (Cases à cocher)
            behaviorChanges: (data.behaviorChanges || []) as string[],
            clinicalSigns: (data.clinicalSigns || []) as string[],

            // 3. Durée et inquiétude
            duration: data.duration,
            worryLevel: data.worryLevel,

            // 4. Actions
            actionsTaken: (data.actionsTaken || []) as string[],

            // 5. Notes
            additionalNotes: data.additionalNotes || ""
        }).returning({ id: diagnosis.id });

        console.log("✅ Sauvegardé avec succès, ID :", resultat[0].id);
        
        res.status(200).json({ success: true, id: resultat[0].id });

    } catch (error) {
        console.error("❌ Erreur lors de l'insertion Drizzle :", error);
        res.status(500).json({ success: false, error: "Erreur serveur lors de la sauvegarde" });
    }
});