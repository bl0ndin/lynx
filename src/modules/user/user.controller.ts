import {
  Body, Controller, Delete, Get, Inject, Post, Put, Req, UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { UserService } from './user.service';
import { VChangeUserRole, VProfile, VUpdatePassword } from './user.validations';
import { IRequest } from '../../interfaces/request.interface';
import { UserRoles } from './guards/roles.decorator';
import { DAuthenticatedUser, DUserProfile } from './user.dto';
import { USER_ROLE } from './user.constants';
import { AuthenticationService } from '../core/authentication/authentication.service';
import { STORAGE_S3_PROVIDER } from '../core/storage/s3/s3.constants';
import { StorageEngine } from 'multer';
import { StorageService } from '../core/storage/storage.service';
import { STORAGE_TYPE } from '../core/storage/storage.constants';
import { mixinStorageInterceptor } from '../core/storage/storage.interceptor.mixin';

@Controller()
@UserRoles(USER_ROLE.DEFAULT, USER_ROLE.ADMIN)
export class UserUserController {

  constructor(
    private userService: UserService,
    private authenticationService: AuthenticationService,
    @Inject(STORAGE_S3_PROVIDER) private s3StorageProvider: StorageEngine,
    private storageService: StorageService,
  ) {
  }

  @Get()
  public async getMe(@Req() req: IRequest): Promise<DUserProfile> {
    return new DUserProfile(req.user);
  }

  @Delete()
  public async deleteMe(@Req() req: IRequest): Promise<{}> {
    await this.userService.remove(req.user.id);
    return {};
  }

  @Put()
  public async updateMe(@Req() req: IRequest, @Body() body: VProfile): Promise<DUserProfile> {
    const updatedUser = await this.userService.update(req.user, body);
    return new DUserProfile(updatedUser);
  }

  @Put('/type')
  @UserRoles(USER_ROLE.DEFAULT)
  public async changeType(
    @Req() req: IRequest,
    @Body() data: VChangeUserRole,
  ): Promise<DUserProfile> {
    const updatedUser = await this.userService.update(req.user, data);
    return new DUserProfile(updatedUser);
  }

  @Post()
  public async updateMyPassword(@Req() req: IRequest, @Body() body: VUpdatePassword): Promise<{}> {
    await this.userService.updatePassword(req.user, body.password);
    return {};
  }

  @Post('/image')
  @UseInterceptors(mixinStorageInterceptor(() => 'file', () => STORAGE_TYPE.AWS_S3))
  public async changeProfileImage(
    @Req() req: IRequest,
    @UploadedFile() image: Express.MulterS3.File,
  ): Promise<DUserProfile> {

    const storedImage = await this.storageService.save(image, STORAGE_TYPE.AWS_S3);

    const user = await this.userService.changeProfileImage(req.user, storedImage);

    return new DUserProfile(user);
  }

  @Delete('/impersonate')
  public async stopImpersonation(@Req() req: IRequest): Promise<DAuthenticatedUser> {
    const user = await this.userService.get(req.impersonatedById);
    const token = await this.authenticationService.sign(req.impersonatedById);

    return new DAuthenticatedUser(user, token);
  }
}
