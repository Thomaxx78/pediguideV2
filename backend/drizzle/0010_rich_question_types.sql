-- Add rich question types to the enum
ALTER TYPE question_type ADD VALUE IF NOT EXISTS 'date';
ALTER TYPE question_type ADD VALUE IF NOT EXISTS 'symptom_picker';
ALTER TYPE question_type ADD VALUE IF NOT EXISTS 'symptom_timeline';
ALTER TYPE question_type ADD VALUE IF NOT EXISTS 'allergy_picker';
ALTER TYPE question_type ADD VALUE IF NOT EXISTS 'antecedent_picker';
ALTER TYPE question_type ADD VALUE IF NOT EXISTS 'scale';
