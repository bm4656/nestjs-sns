import { Injectable, NotFoundException } from '@nestjs/common';
import { PostsModel } from './entities/posts.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(PostsModel)
    private readonly postsRepository: Repository<PostsModel>,
  ) {}

  async getAllPosts() {
    return this.postsRepository.find();
  }

  async getPostById(id: number) {
    const post = await this.postsRepository.findOne({ where: { id } });
    if (!post) {
      throw new NotFoundException(`데이터가 존재하지 않습니다.(${id})`);
    }

    return post;
  }

  async createPost(author: string, title: string, content: string) {
    const post = this.postsRepository.create({
      author,
      title,
      content,
      likeCount: 0,
      commentCount: 0,
    });

    return await this.postsRepository.save(post);
  }

  async updatePost(id: number, author: string, title: string, content: string) {
    const post = await this.postsRepository.findOne({ where: { id } });
    if (!post) {
      throw new NotFoundException(`데이터가 존재하지 않습니다.(${id})`);
    }

    if (author) {
      post.author = author;
    }

    if (title) {
      post.title = title;
    }

    if (content) {
      post.content = content;
    }

    return await this.postsRepository.save(post);
  }

  async deletePost(id: number) {
    const post = await this.postsRepository.findOne({ where: { id } });
    if (!post) {
      throw new NotFoundException(`데이터가 존재하지 않습니다.(${id})`);
    }

    await this.postsRepository.delete(id);
    return id;
  }
}
