import {
  createParamDecorator,
  ExecutionContext,
  InternalServerErrorException,
} from '@nestjs/common';

export const User = createParamDecorator((data, context: ExecutionContext) => {
  const request = context.switchToHttp().getRequest();

  const user = request.user;

  if (!user) {
    throw new InternalServerErrorException(
      'User 데코레이터는 AccessTokenGuard와 함께 사용해야합니다.',
    );
  }
  return user;
});
