import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { AccessTokenGuard } from '../auth/guard/bearer-token.guard';
import { User } from '../users/decorator/user.decorator';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  // 1. GET /posts -> 모든 포스트를 조회한다.
  @Get()
  /**
   * serialization -> 직렬화 -> 현재 시스템(NestJS)에서 사용되는 데이터의 구조를 다른 시스템에서도 쉽게
   *                          사용 할 수 있는 포맷으로 변환
   *                          -> class의 object에서 JSON 포맷으로 변환
   * deserialization -> 역직렬화
   */
  getPosts() {
    return this.postsService.getAllPosts();
  }

  // 2. GET /posts/:id -> id에 해당하는 포스트를 가져온다.
  @Get(':id')
  getPost(@Param('id', ParseIntPipe) id: number) {
    return this.postsService.getPostById(id);
  }

  // 3. POST /posts -> 새로운 포스트를 생성한다.
  @Post()
  @UseGuards(AccessTokenGuard)
  postPosts(@User('id') userId: number, @Body() body: CreatePostDto) {
    return this.postsService.createPost(userId, body);
  }

  // 4. Patch /posts/:id -> id에 해당하는 포스트를 수정한다.
  @Patch(':id')
  patchPost(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdatePostDto,
  ) {
    return this.postsService.updatePost(id, body);
  }

  // 5. DELETE /posts/:id -> id에 해당하는 포스트를 삭제한다.
  @Delete(':id')
  deletePost(@Param('id', ParseIntPipe) id: number) {
    return this.postsService.deletePost(id);
  }
}
