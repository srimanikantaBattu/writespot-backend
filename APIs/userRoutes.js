const {Router} = require('express');
const verifyToken = require('../Middlewares/verifyToken');
const {registerUser,loginUser,getUser,changeAvatar,editUserDetails,getAuthors} = require('../controllers/userControllers')
const router=Router();


router.post('/register',registerUser);
router.post('/login',loginUser);
router.get('/:id',getUser);
router.get('/',getAuthors);
router.post('/change-avatar',verifyToken,changeAvatar);
router.patch('/edit-user',verifyToken,editUserDetails)


module.exports=router;