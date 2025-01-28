import { Column, Entity, OneToMany } from 'typeorm';
import { RolesEnum } from '../const/roles.enum';
import { PostsModel } from '../../posts/entities/posts.entity';
import { BaseModel } from '../../common/entities/base.entity';
import { IsEmail, IsString, Length } from 'class-validator';

@Entity()
export class UsersModel extends BaseModel {
  @Column({
    // 1) 길이가 20을 넘지 않을 것
    length: 20,
    // 2) 유일무이한 값이 될 것
    unique: true,
  })
  @IsString()
  @Length(1, 20, { message: '닉네임은 1~20자 사이로 입력해주세요.' })
  nickname: string;

  @Column({
    unique: true,
  })
  @IsString()
  @IsEmail()
  email: string;

  @Column()
  @IsString()
  @Length(3, 8)
  password: string;

  @Column({
    enum: Object.values(RolesEnum),
    default: RolesEnum.USER,
  })
  role: RolesEnum;

  @OneToMany(() => PostsModel, (post) => post.author)
  posts: PostsModel[];
}
