import {
  Controller, Post, UseInterceptors,
  Req, UploadedFile, Get, ForbiddenException,
} from '@nestjs/common';
import { IRequest } from '../../interfaces/request.interface';
import { STORAGE_TYPE } from '../core/storage/storage.constants';
import { StorageService } from '../core/storage/storage.service';
import { mixinStorageInterceptor } from '../core/storage/storage.interceptor.mixin';
import { LoggerService } from '../core/logger/logger.service';
import { UserBlockedException } from '../user/exceptions/userBlocked.exception';

@Controller()
export class DemoController {

  constructor(
    private storageService: StorageService,
    private loggerService: LoggerService,
  ) {
  }

  @Get('/logger')
  public async logger(@Req() req) {
    this.loggerService.error('error');
    this.loggerService.warning('warning');
    this.loggerService.debug('debug');
    this.loggerService.info('info');
    this.loggerService.silly('silly');
  }

  @Get('/exception/custom')
  public async exceptionCustom() {
    throw new UserBlockedException();
  }

  @Get('/exception/http')
  public async exceptionHttp() {
    throw new ForbiddenException({ message: 'this should be', with: ['an', 'array'] });
  }

  @Post('/upload')
  @UseInterceptors(mixinStorageInterceptor(
    () => 'file',
  ))
  public async upload(
    @Req() req: IRequest,
    @UploadedFile() file: Express.MulterS3.File,
  ) {
    // file should have path/destination property if is written
    console.log('file uploaded', file);

    const saved = await this.storageService.save(file, STORAGE_TYPE.DISK);

    return saved;
  }

}
