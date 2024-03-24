import { UpdateDealDto } from './dto/updateDeal.dto';
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import {
  ApiTags,
  ApiResponse,
  ApiOperation,
  ApiConsumes,
} from '@nestjs/swagger';
import { CreateDealDto } from './dto/createDeal.dto';
import { InternalServerError, NotFoundError } from '../errors';
import { DealDtoResponse } from './dto/dealResponse.dto';
import { ListDealDtoResponse } from './dto/listDealsResponse.dto';
import { UploadDocumentDTO } from './dto/uploadDocument.dto';
import { UploadDocumentResponseDTO } from './dto/uploadDocumentResponse.dto';
import { WhitelistWalletDto } from './dto/whitelistWallet.dto';
import { WalletResponseDTO } from './dto/walletResponse.dto';
import DealModel from './deals.model';
import fileInterceptor from '../file.interceptor';
import { filePipeValidator } from '../multer.options';
import * as fs from 'fs';
import { s3Service } from 'src/aws/s3.service';

@ApiTags('deals')
@Controller('deals')
export class DealsController {
  private async uploadFile(
    file: { path: string; originalname: string },
    dealId: string,
  ): Promise<string | undefined> {
    const fileBuffer = fs.readFileSync(file.path);

    const timestamp = Date.now();
    const key = `deals/${dealId}/${timestamp}-${file.originalname}`;

    const uploadedUrl = await s3Service.uploadFile(key, fileBuffer);
    return uploadedUrl;
  }

  @Get()
  @ApiOperation({ summary: 'Get all deals' })
  @ApiResponse({
    status: 200,
    type: [ListDealDtoResponse],
    description: 'Returns all deals',
  })
  async findAll(): Promise<ListDealDtoResponse[]> {
    const deals = await DealModel.find();
    return deals.map((doc) => new ListDealDtoResponse(doc.toJSON()));
  }

  @Post()
  @ApiOperation({ summary: 'Create a deal' })
  @ApiResponse({
    status: 201,
    type: DealDtoResponse,
    description: 'The deal has been successfully created',
  })
  async create(@Body() dealDto: CreateDealDto): Promise<DealDtoResponse> {
    const deal = await DealModel.create(dealDto);
    return new DealDtoResponse(deal.toJSON());
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a deal' })
  @ApiResponse({
    status: 200,
    type: DealDtoResponse,
    description: 'Returns deal with id',
  })
  async findOne(@Param('id') id: string): Promise<DealDtoResponse> {
    const deal = await DealModel.findById(id);
    if (!deal) {
      throw new NotFoundError();
    }
    return new DealDtoResponse(deal.toJSON());
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a deal' })
  @ApiResponse({
    status: 200,
    type: DealDtoResponse,
    description: 'The deal has been successfully updated',
  })
  async update(
    @Param('id') id: string,
    @Body() dealDto: UpdateDealDto,
  ): Promise<DealDtoResponse> {
    const deal = await DealModel.findByIdAndUpdate(
      id,
      { $set: dealDto },
      { new: true },
    );
    if (!deal) {
      throw new NotFoundError();
    }
    return new DealDtoResponse(deal.toJSON());
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a deal' })
  @ApiResponse({
    status: 200,
    description: 'The deal has been successfully deleted',
  })
  async delete(@Param('id') id: string): Promise<void> {
    await DealModel.findByIdAndDelete(id);
  }

  @Post(':id/docs')
  @ApiOperation({ summary: 'Upload document to a deal milestone' })
  @ApiResponse({
    status: 200,
    type: UploadDocumentResponseDTO,
    description: 'The deal document was successfully uploaded',
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(fileInterceptor)
  async uploadDealDocument(
    @Param('id') id: string,
    @Body() payload: UploadDocumentDTO,
    @UploadedFile(filePipeValidator) file: Express.Multer.File,
  ): Promise<UploadDocumentResponseDTO> {
    const fileUrl = await this.uploadFile(file, id);

    const deal = await DealModel.findByIdAndUpdate(
      id,
      {
        $push: { docs: { url: fileUrl, ...payload } },
      },
      { new: true },
    );

    const docs = deal.docs.pop();

    return new UploadDocumentResponseDTO(docs.toJSON());
  }

  @Delete(':id/docs/:docId')
  @ApiOperation({ summary: 'Delete deal document' })
  @ApiResponse({
    status: 200,
    description: 'The deal document was successfully deleted',
  })
  async deleteDealDocument(
    @Param('id') id: string,
    @Param('docId') docId: string,
  ): Promise<void> {
    await DealModel.findByIdAndUpdate(id, {
      $pull: { docs: { _id: docId } },
    });
  }

  @Post(':id/whitelist')
  @ApiOperation({ summary: 'Whitelist wallet' })
  @ApiResponse({
    status: 200,
    type: WalletResponseDTO,
    description: 'The wallet was successfully whitelisted',
  })
  async whitelistAddress(
    @Param('id') id: string,
    @Body() payload: WhitelistWalletDto,
  ): Promise<WalletResponseDTO> {
    const deal = await DealModel.findByIdAndUpdate(
      id,
      {
        $push: { whitelist: payload },
      },
      { new: true },
    );

    const whitelist = deal.whitelist;

    if (!whitelist.length) {
      throw new InternalServerError('failed pusing wallet');
    }

    const wallet = whitelist.pop();
    return new WalletResponseDTO(wallet.toJSON());
  }

  @Delete(':id/whitelist/:walletId')
  @ApiOperation({ summary: 'Remove wallet from whitelist' })
  @ApiResponse({
    status: 200,
    description: 'The wallet was successfully deleted from whitelist',
  })
  async blacklistAddress(
    @Param('id') id: string,
    @Param('walletId') walletId: string,
  ): Promise<void> {
    await DealModel.findByIdAndUpdate(id, {
      $pull: { whitelist: { _id: walletId } },
    });
  }

  @Post(':id/milestones/:milestoneId/docs')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload document to a deal milestone' })
  @ApiResponse({
    status: 200,
    type: UploadDocumentResponseDTO,
    description: 'The deal milestone document was successfully uploaded',
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(fileInterceptor)
  async uploadMilestoneDocument(
    @Param('id') id: string,
    @Param('milestoneId') milestoneId: string,
    @Body() payload: UploadDocumentDTO,
    @UploadedFile(filePipeValidator) file: Express.Multer.File,
  ): Promise<UploadDocumentResponseDTO> {
    const fileUrl = await this.uploadFile(file, id);

    const deal = await DealModel.findOneAndUpdate(
      { _id: id, 'milestones._id': milestoneId },
      {
        $push: { 'milestones.$.docs': { url: fileUrl, ...payload } },
      },
      { new: true },
    );

    const milestone = deal.milestones.find(
      (m) => m.toJSON().id === milestoneId,
    );

    if (!milestone) {
      throw new NotFoundError('milestone not found');
    }

    const docs = milestone.docs.pop();

    return new UploadDocumentResponseDTO(docs.toJSON());
  }

  @Delete(':id/milestones/:milestoneId/docs/:docId')
  @ApiOperation({ summary: 'Delete a milestone document' })
  @ApiResponse({
    status: 200,
    description: 'The deal milestone document was successfully deleted',
  })
  async deleteMilestoneDocument(
    @Param('id') id: string,
    @Param('milestoneId') milestoneId: string,
    @Param('docId') docId: string,
  ): Promise<void> {
    await DealModel.findOneAndUpdate(
      { _id: id, 'milestones._id': milestoneId },
      {
        $pull: { 'milestones.$.docs': { _id: docId } },
      },
    );
  }
}
