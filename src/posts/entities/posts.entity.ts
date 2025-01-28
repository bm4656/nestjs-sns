import { Column, Entity, ManyToOne } from 'typeorm';
import { UsersModel } from '../../users/entities/users.entity';
import { BaseModel } from 'src/common/entities/base.entity';
import { IsString } from 'class-validator';

@Entity()
export class PostsModel extends BaseModel {
  // 1) UsersModel과 연동한다. Foreign Key를 이용해서
  // 2) null이 돨 수 없다.
  @ManyToOne(() => UsersModel, (user) => user.posts, {
    nullable: false,
  })
  author: UsersModel;

  @Column()
  @IsString({ message: 'title은 string 타입을 입력해줘야합니다.' })
  title: string;

  @Column()
  @IsString({ message: 'content는 string 타입을 입력해줘야합니다.' })
  content: string;

  @Column()
  likeCount: number;

  @Column()
  commentCount: number;
}
