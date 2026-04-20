import mongoose, { type InferSchemaType, type Model, Schema } from "mongoose";

const MemberSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    year: { type: String, required: true, trim: true },
    dept: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const TeamSchema = new Schema(
  {
    teamCode: { type: String, required: true, unique: true, index: true, uppercase: true, trim: true },
    sport: { type: String, required: true, index: true, trim: true },
    category: { type: String, required: true, trim: true },
    teamName: { type: String, required: true, trim: true },
    captain: { type: MemberSchema, required: true },
    members: { type: [MemberSchema], default: [] },
    maxMembers: { type: Number, required: true },
    status: { type: String, enum: ["open", "full", "closed"], default: "open", index: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: true },
    versionKey: "__v",
  }
);

TeamSchema.index({ sport: 1, status: 1 });
TeamSchema.index({ createdAt: -1 });

export type TeamMember = InferSchemaType<typeof MemberSchema>;
export type TeamDocument = InferSchemaType<typeof TeamSchema>;

const Team: Model<TeamDocument> = mongoose.models.Team || mongoose.model<TeamDocument>("Team", TeamSchema);

export default Team;

