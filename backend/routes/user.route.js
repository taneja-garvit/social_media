import { editProfile, followOrUnfollow, getProfile, getSuggestedUser, login, logout, register } from "../controllers/user.controller.js";
import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import upload from "../middlewares/multer.js";

const router=express.Router()

router.route("/register").post(register)
router.route("/login").post(login)
router.route("/logout").get(logout)
router.route("/:id/profile").get(isAuthenticated, getProfile)
router.route('/profile/edit').post(isAuthenticated, upload.single('profilePhoto'), editProfile);
router.route("/suggested").get(isAuthenticated, getSuggestedUser);
router.route("/followUnfollow/:id").get(isAuthenticated, followOrUnfollow);

export default router

// now ye index.js me import hoga


