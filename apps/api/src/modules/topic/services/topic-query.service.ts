import { Injectable, NotFoundException } from '@nestjs/common';
import { ListTopicsQueryDto } from '../dto/list-topics-query.dto';
import { TopicRepository } from '../topic.repository';

@Injectable()
export class TopicQueryService {
  constructor(private readonly topicRepository: TopicRepository) {}

  async listTopics(query: ListTopicsQueryDto) {
    const skip = (query.page - 1) * query.limit;
    return this.topicRepository.findMany({
      status: query.status,
      q: query.q,
      minScore: query.minScore,
      skip,
      take: query.limit,
    });
  }

  async getTopic(topicId: string) {
    const topic = await this.topicRepository.findById(topicId);
    if (!topic) {
      throw new NotFoundException('Topic not found');
    }

    return topic;
  }

  async getStatusHistory(topicId: string) {
    await this.getTopic(topicId);
    return this.topicRepository.findStatusHistory(topicId);
  }
}
