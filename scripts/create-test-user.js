"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var supabase_js_1 = require("@supabase/supabase-js");
var dotenv = require("dotenv");
dotenv.config({ path: '.env.local' });
var supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
var supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // This needs to be added to .env.local
function createTestUser() {
    return __awaiter(this, void 0, void 0, function () {
        var supabase, testUser, _a, user, createError, profileError, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!supabaseUrl || !supabaseServiceKey) {
                        console.error('Missing environment variables. Please check .env.local');
                        process.exit(1);
                    }
                    supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey);
                    testUser = {
                        email: 'test@fitnesstrack.local',
                        password: 'Test123!@#',
                        user_metadata: {
                            name: 'Test User',
                            age: 25,
                            fitness_goals: 'Build strength and improve endurance',
                        },
                    };
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, supabase.auth.admin.createUser({
                            email: testUser.email,
                            password: testUser.password,
                            email_confirm: true, // Auto-confirm email
                            user_metadata: testUser.user_metadata,
                        })];
                case 2:
                    _a = _b.sent(), user = _a.data, createError = _a.error;
                    if (createError) {
                        throw createError;
                    }
                    if (!user.user) {
                        throw new Error('Failed to create test user');
                    }
                    return [4 /*yield*/, supabase.from('profiles').insert({
                            id: user.user.id,
                            email: testUser.email,
                            name: testUser.user_metadata.name,
                            age: testUser.user_metadata.age,
                            fitness_goals: testUser.user_metadata.fitness_goals,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString(),
                        })];
                case 3:
                    profileError = (_b.sent()).error;
                    if (profileError) {
                        console.error('Error creating profile:', profileError);
                    }
                    console.log('\n=== Test User Created Successfully ===');
                    console.log('Email:', testUser.email);
                    console.log('Password:', testUser.password);
                    console.log('User ID:', user.user.id);
                    console.log('\nYou can now log in with these credentials at http://localhost:3001/login');
                    return [3 /*break*/, 5];
                case 4:
                    error_1 = _b.sent();
                    console.error('Error creating test user:', error_1);
                    process.exit(1);
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    });
}
createTestUser();
