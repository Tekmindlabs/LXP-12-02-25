import { PrismaClient, Prisma } from '@prisma/client';
import { AssessmentService } from './AssessmentService';
import { SubjectAssessmentConfig } from '../../types/grades';

interface Assessment {
	id: string;
	type: string;
	[key: string]: any;
}

interface Submission {
	activityId: string;
	[key: string]: any;
}

interface AssessmentPeriodGrade {
	periodId: string;
	obtainedMarks: number;
	totalMarks: number;
	percentage: number;
	weight: number;
	isPassing: boolean;
	gradePoints?: number;
}

interface SubjectTermGrade {
	termId: string;
	periodGrades: Record<string, AssessmentPeriodGrade>;
	finalGrade: number;
	totalMarks: number;
	percentage: number;
	isPassing: boolean;
	gradePoints: number;
	credits: number;
}

export class SubjectGradeManager {
	private assessmentService: AssessmentService;

	constructor(private db: PrismaClient) {
		this.assessmentService = new AssessmentService(db);
	}

	private async getSubmissionsForPeriod(
		_subjectId: string,
		_periodId: string,
		_studentId: string
	): Promise<Submission[]> {
		// Implementation
		return [];
	}

	private getAssessmentWeight(
		assessmentType: string,
		weightageDistribution: Record<string, number>
	): number {
		return weightageDistribution[assessmentType.toLowerCase()] || 1;
	}

	private async calculateSubmissionPercentage(
		_submission: Submission,
		_assessment: Assessment
	): Promise<number> {
		// Implementation
		return 0;
	}

	private checkPassingCriteria(
		percentage: number,
		config: SubjectAssessmentConfig
	): boolean {
		return percentage >= (config.passingCriteria.minPercentage || 50);
	}


	async calculateAssessmentPeriodGrade(
		subjectId: string,
		periodId: string,
		studentId: string,
		assessmentSystemId: string,
		config: SubjectAssessmentConfig
	): Promise<AssessmentPeriodGrade> {
		const period = await this.db.termAssessmentPeriod.findUnique({
			where: { id: periodId }
		});

		const submissions = await this.getSubmissionsForPeriod(subjectId, periodId, studentId);
		let totalWeightedScore = 0;
		let totalWeight = 0;

		for (const submission of submissions) {
			const assessment = await this.assessmentService.getAssessmentForActivity(submission.activityId);
			if (!assessment) continue;

			const weight = this.getAssessmentWeight(assessment.type, config.weightageDistribution);
			const percentage = await this.calculateSubmissionPercentage(submission, assessment);
			
			totalWeightedScore += percentage * weight;
			totalWeight += weight;
		}

		const finalPercentage = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
		const gradePoints = await this.assessmentService.calculateGPA(finalPercentage, assessmentSystemId);
		const isPassing = this.checkPassingCriteria(finalPercentage, config);

		return {
			periodId,
			obtainedMarks: totalWeightedScore,
			totalMarks: totalWeight * 100,
			percentage: finalPercentage,
			weight: period?.weight || 0,
			isPassing,
			gradePoints
		};
	}


	async calculateSubjectTermGrade(
		subjectId: string,
		termId: string,
		studentId: string,
		assessmentSystemId: string
	): Promise<SubjectTermGrade> {
		const periods = await this.db.termAssessmentPeriod.findMany({
			where: { termId }
		});

		const subject = await this.db.subject.findUnique({
			where: { id: subjectId },
			include: { subjectConfig: true }
		});

		if (!subject?.subjectConfig) {
			throw new Error('Subject configuration not found');
		}

		const config = subject.subjectConfig as unknown as SubjectAssessmentConfig;
		const periodGrades: Record<string, AssessmentPeriodGrade> = {};
		let weightedTotal = 0;
		let weightSum = 0;

		for (const period of periods) {
			const grade = await this.calculateAssessmentPeriodGrade(
				subjectId,
				period.id,
				studentId,
				assessmentSystemId,
				config
			);
			periodGrades[period.id] = grade;
			weightedTotal += (grade.percentage * grade.weight);
			weightSum += grade.weight;
		}

		const finalPercentage = weightSum > 0 ? weightedTotal / weightSum : 0;
		const totalMarks = Object.values(periodGrades).reduce((sum, grade) => sum + grade.totalMarks, 0);
		const gradePoints = await this.assessmentService.calculateGPA(finalPercentage, assessmentSystemId);

		return {
			termId,
			periodGrades,
			finalGrade: finalPercentage,
			totalMarks,
			percentage: finalPercentage,
			isPassing: finalPercentage >= (config.passingCriteria.minPercentage || 50),
			gradePoints,
			credits: subject?.credits || 0
		};
	}

	async initializeSubjectGrades(
		gradeBookId: string,
		subject: any,
		_termStructure: any // Prefix with _ since it's unused
	): Promise<void> {
		await this.db.subjectGradeRecord.create({
			data: {
				gradeBookId,
				subjectId: subject.id,
				termGrades: Prisma.JsonNull,
				assessmentPeriodGrades: Prisma.JsonNull
			}
		});
	}



	async updateSubjectGradeRecord(
		gradeBookId: string,
		subjectId: string,
		termId: string,
		studentId: string
	): Promise<void> {
		const [termGrade, existingRecord] = await Promise.all([
			this.calculateSubjectTermGrade(subjectId, termId, studentId, gradeBookId),
			this.db.subjectGradeRecord.findFirst({
				where: {
					gradeBookId,
					subjectId
				}
			})
		]);
		
		const existingTermGrades = existingRecord?.termGrades as Record<string, SubjectTermGrade> || {};
		const updatedTermGrades = {
			...existingTermGrades,
			[termId]: termGrade
		};
		
		await this.db.subjectGradeRecord.upsert({
			where: {
				id: existingRecord?.id ?? '',
			},
			update: {
				termGrades: updatedTermGrades
			},
			create: {
				gradeBookId,
				subjectId,
				termGrades: { [termId]: termGrade },
				assessmentPeriodGrades: Prisma.JsonNull
			}
		});

		// Record grade history
		await this.recordGradeHistory(studentId, subjectId, termGrade);
	}


	private async recordGradeHistory(
		studentId: string,
		subjectId: string,
		termGrade: SubjectTermGrade
	): Promise<void> {
		await this.db.gradeHistory.create({
			data: {
				studentId,
				subjectId,
				assessmentId: termGrade.termId, // Use termId as assessmentId
				gradeValue: termGrade.finalGrade,
				oldValue: null,
				modifiedBy: 'SYSTEM',
				reason: 'Term grade calculation'
			}
		});
	}


}