const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const preferenceSchema = new Schema({
    
    theme: {
        type: String,
        enum: ['light', 'dark', 'high-contrast'],
        default: 'light',
    },
    fontSize: {
        type: String,
        enum: ['small', 'medium', 'large', 'extra-large'],
        default: 'large',
    },
        
    // Meal and medication timing preferences
    mealPreferences: {
        // Time periods before meals when medication should be taken (in minutes)
        beforeMealMedicationTime: { 
            type: Number,
            min: 0,
            max: 120,
            default: 30
        },
        
        // Time periods after meals when medication should be taken (in minutes)
        afterMealMedicationTime: { 
            type: Number,
            min: 0,
            max: 120,
            default: 30
        },
        
        breakfastTime: { type: String, default: "08:00" },
        lunchTime: { type: String, default: "12:30" },
        dinnerTime: { type: String, default: "18:00" },
        
        // Diet preferences
        dietaryRestrictions: [{
            type: String,
            enum: ['none', 'vegetarian', 'vegan', 'dairy-free', 'gluten-free', 'low-sodium', 'diabetic', 'other']
        }],
        
        // Food allergies
        foodAllergies: [{ type: String }]
    },
    
    // Exercise preferences
    exercisePreferences: {
        preferredExerciseTime: {
            type: String,
            enum: ['morning', 'afternoon', 'evening'],
            default: 'morning'
        },
        exerciseDuration: {
            type: Number,
            min: 5,
            max: 60,
            default: 15
        },
        exerciseIntensity: {
            type: String,
            enum: ['very-light', 'light', 'moderate', 'somewhat-vigorous'],
            default: 'light'
        }
    },
    
    // Sleep preferences
    sleepPreferences: {
        bedTime: { type: String, default: "21:00" },
        wakeTime: { type: String, default: "07:00" },
        napTime: { type: Boolean, default: true }
    },
    
    // Emergency contact information
    emergencyContact: {
        name: { type: String },
        relationship: { type: String },
        phone: { type: String },
        alternate: { type: String }
    }
});

const Preference = model('Preference', preferenceSchema, 'preferences');

module.exports = Preference;