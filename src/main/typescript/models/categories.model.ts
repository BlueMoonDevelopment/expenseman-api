import mongoose, { InferSchemaType } from 'mongoose';

const CategorySchema = new mongoose.Schema({
    category_owner_id: {
        type: mongoose.Types.ObjectId,
        required: true,
    },
    category_name: {
        type: String,
        required: true,
    },
    category_type: {
        type: String,
        required: true,
    },
    category_desc: {
        type: String,
        default: '',
    },
    category_color: {
        type: String,
        default: 'red',
    },
    category_symbol: {
        type: String,
        default: 'Bank Symbol',
    },
});

type ICategory = InferSchemaType<typeof CategorySchema>;

export const Category = mongoose.model<ICategory>('Category', CategorySchema);