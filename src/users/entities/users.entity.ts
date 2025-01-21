import { Column, Entity, OneToMany } from 'typeorm';
import { RolesEnum } from '../const/roles.enum';
import { PostsModel } from '../../posts/entities/posts.entity';
import { BaseModel } from '../../common/entities/base.entity';

@Entity()
export class UsersModel extends BaseModel {
  @Column({
    // 1) 길이가 20을 넘지 않을 것
    length: 20,
    // 2) 유일무이한 값이 될 것
    unique: true,
  })
  nickname: string;

  @Column({
    unique: true,
  })
  email: string;

  @Column()
  password: string;

  @Column({
    enum: Object.values(RolesEnum),
    default: RolesEnum.USER,
  })
  role: RolesEnum;

  @OneToMany(() => PostsModel, (post) => post.author)
  posts: PostsModel[];
}
