const {Router} = require('express');
const router=Router();
const verifyToken = require('../Middlewares/verifyToken')

const {createPost,getPosts,getPost,getCatPosts,getUserPosts,editPost,deletePost,createComment} = require('../controllers/postControllers')

router.post('/',verifyToken,createPost)
router.get('/',getPosts)
router.get('/:id',getPost)
router.patch('/:id',verifyToken,editPost)
router.get('/categories/:category',getCatPosts)
router.get('/users/:id',getUserPosts);
router.delete('/:id',verifyToken,deletePost)
router.post('/comment',verifyToken,createComment);

module.exports=router;