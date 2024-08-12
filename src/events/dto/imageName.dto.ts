export class Image {
  images: Express.Multer.File[];
}

export class EventImage {
  id: number;
  documentName: string;
  documentUrl: string;
};